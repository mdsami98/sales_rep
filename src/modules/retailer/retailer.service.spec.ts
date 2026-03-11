import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RetailersService } from './retailer.service';
import { RetailersRepository } from 'src/core/repositories/retailer.repository';
import { RegionsRepository } from 'src/core/repositories/regions.repository';
import { AreasRepository } from 'src/core/repositories/area.repository';
import { DistributorsRepository } from 'src/core/repositories/distributors.repository';
import { TerritoriesRepository } from 'src/core/repositories/territories.repository';
import { RedisService } from '../redis/redis.service';
import * as csvParser from 'src/common/utility/csv.parser.utility';
import { QueryRetailersDto, UpdateRetailerDto } from './dtos/retailers.dto';

// Mock the parseCsv utility so we don't spin up real streams
jest.mock('src/common/utility/csv.parser.utility');

// ─── Shared mock data ────────────────────────────────────────────────────────

const mockRetailer = {
  id: 'uuid-1',
  uid: 'RET-0000001',
  name: 'Khan Store',
  phone: '01712345678',
  points: 500,
  routes: 'Route-5',
  notes: null,
};

const mockRetailerList = [
  mockRetailer,
  {
    id: 'uuid-2',
    uid: 'RET-0000002',
    name: 'Rahim Shop',
    phone: '01898765432',
    points: 300,
    routes: null,
    notes: null,
  },
];

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockRetailersRepo = {
  findAllRetailers: jest.fn(),
  findByUid: jest.fn(),
  findAssignedRetailers: jest.fn(),
  findByUidForSalesRep: jest.fn(),
  save: jest.fn(),
  saveManyInChunks: jest.fn(),
  findByUids: jest.fn(),
};

const mockRegionRepo = { findAll: jest.fn() };
const mockAreaRepo = { findAll: jest.fn() };
const mockDistributorRepo = { findAll: jest.fn() };
const mockTerritoryRepo = { findAll: jest.fn() };

const mockRedisService = {
  getOrSet: jest.fn(),
  delPattern: jest.fn(),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Makes getOrSet call the factory immediately (cache miss path). */
const cacheMiss = () =>
  mockRedisService.getOrSet.mockImplementation(
    async (_key: string, factory: () => Promise<unknown>) => factory(),
  );

/** Makes getOrSet return a pre-cached value (cache hit path). */
const cacheHit = (value: unknown) =>
  mockRedisService.getOrSet.mockResolvedValue(value);

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('RetailersService', () => {
  let service: RetailersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetailersService,
        { provide: RetailersRepository, useValue: mockRetailersRepo },
        { provide: RegionsRepository, useValue: mockRegionRepo },
        { provide: AreasRepository, useValue: mockAreaRepo },
        { provide: DistributorsRepository, useValue: mockDistributorRepo },
        { provide: TerritoriesRepository, useValue: mockTerritoryRepo },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<RetailersService>(RetailersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  findAll
  // ═══════════════════════════════════════════════════════════════════════

  describe('findAll', () => {
    const query: QueryRetailersDto = { page: 1, limit: 20 };

    it('should build correct cache key and call getOrSet', async () => {
      cacheHit({ data: mockRetailerList, meta: { total: 2 } });

      await service.findAll(query);

      expect(mockRedisService.getOrSet).toHaveBeenCalledWith(
        `retailers:all:${JSON.stringify(query)}`,
        expect.any(Function),
        30,
      );
    });

    it('should return cached result without hitting the repo (cache hit)', async () => {
      const cached = { data: mockRetailerList, meta: { total: 2 } };
      cacheHit(cached);

      const result = await service.findAll(query);

      expect(result).toEqual(cached);
      expect(mockRetailersRepo.findAllRetailers).not.toHaveBeenCalled();
    });

    it('should query the repo and return shaped response on cache miss', async () => {
      cacheMiss();
      mockRetailersRepo.findAllRetailers.mockResolvedValue({
        data: mockRetailerList,
        total: 50,
        page: 1,
        limit: 20,
      });

      const result = await service.findAll(query) as any;

      expect(mockRetailersRepo.findAllRetailers).toHaveBeenCalledWith(query);
      expect(result.message).toBe('Retailers fetched successfully');
      expect(result.data).toEqual(mockRetailerList);
      expect(result.meta).toEqual({ total: 50, page: 1, limit: 20, totalPages: 3 });
    });

    it('should compute totalPages correctly (ceil)', async () => {
      cacheMiss();
      mockRetailersRepo.findAllRetailers.mockResolvedValue({
        data: [],
        total: 45,
        page: 1,
        limit: 20,
      });

      const result = await service.findAll(query) as any;

      // 45 / 20 = 2.25 → ceil → 3
      expect(result.meta.totalPages).toBe(3);
    });

    it('should pass the full query to the repo (filters / sort)', async () => {
      cacheMiss();
      const filteredQuery: QueryRetailersDto = {
        search: 'Khan',
        region_id: 'region-uuid',
        sort_by: 'name',
        sort_order: 'DESC',
        page: 2,
        limit: 10,
      };
      mockRetailersRepo.findAllRetailers.mockResolvedValue({
        data: [],
        total: 0,
        page: 2,
        limit: 10,
      });

      await service.findAll(filteredQuery);

      expect(mockRetailersRepo.findAllRetailers).toHaveBeenCalledWith(
        filteredQuery,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  findByUid
  // ═══════════════════════════════════════════════════════════════════════

  describe('findByUid', () => {
    it('should return wrapped retailer from cache without hitting repo', async () => {
      cacheHit(mockRetailer);

      const result = await service.findByUid('RET-0000001');

      expect(result.message).toBe('Retailer RET-0000001 fetched successfully');
      expect(result.data).toEqual(mockRetailer);
      expect(mockRetailersRepo.findByUid).not.toHaveBeenCalled();
    });

    it('should query the repo on cache miss and return result', async () => {
      cacheMiss();
      mockRetailersRepo.findByUid.mockResolvedValue(mockRetailer);

      const result = await service.findByUid('RET-0000001');

      expect(mockRetailersRepo.findByUid).toHaveBeenCalledWith('RET-0000001');
      expect(result.data).toEqual(mockRetailer);
    });

    it('should use correct cache key', async () => {
      cacheHit(mockRetailer);

      await service.findByUid('RET-0000001');

      expect(mockRedisService.getOrSet).toHaveBeenCalledWith(
        'retailers:uid:RET-0000001',
        expect.any(Function),
        60,
      );
    });

    it('should throw NotFoundException when retailer does not exist', async () => {
      cacheMiss();
      mockRetailersRepo.findByUid.mockResolvedValue(null);

      await expect(service.findByUid('RET-9999999')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByUid('RET-9999999')).rejects.toThrow(
        'Retailer "RET-9999999" not found',
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  findAssigned
  // ═══════════════════════════════════════════════════════════════════════

  describe('findAssigned', () => {
    const query: QueryRetailersDto = { page: 1, limit: 20 };
    const salesRepId = 'sr-uuid-123';

    it('should include salesRepId in cache key', async () => {
      cacheHit({ data: [], meta: {} });

      await service.findAssigned(salesRepId, query);

      expect(mockRedisService.getOrSet).toHaveBeenCalledWith(
        `retailers:rep:${salesRepId}:${JSON.stringify(query)}`,
        expect.any(Function),
        30,
      );
    });

    it('should return cached result without hitting the repo', async () => {
      const cached = { data: [mockRetailer], meta: { total: 1 } };
      cacheHit(cached);

      const result = await service.findAssigned(salesRepId, query);

      expect(result).toEqual(cached);
      expect(mockRetailersRepo.findAssignedRetailers).not.toHaveBeenCalled();
    });

    it('should call repo with salesRepId and query on cache miss', async () => {
      cacheMiss();
      mockRetailersRepo.findAssignedRetailers.mockResolvedValue({
        data: [mockRetailer],
        total: 1000,
        page: 1,
        limit: 20,
      });

      const result = await service.findAssigned(salesRepId, query) as any;

      expect(mockRetailersRepo.findAssignedRetailers).toHaveBeenCalledWith(
        salesRepId,
        query,
      );
      expect(result.message).toBe('Assigned retailers fetched successfully');
      expect(result.meta.total).toBe(1000);
      expect(result.meta.totalPages).toBe(50); // 1000 / 20
    });

    it('should scope results to a different sales rep when id changes', async () => {
      cacheMiss();
      mockRetailersRepo.findAssignedRetailers.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      await service.findAssigned('other-sr-uuid', query);

      expect(mockRetailersRepo.findAssignedRetailers).toHaveBeenCalledWith(
        'other-sr-uuid',
        query,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  findAssignedByUid
  // ═══════════════════════════════════════════════════════════════════════

  describe('findAssignedByUid', () => {
    const uid = 'RET-0000001';
    const salesRepId = 'sr-uuid-123';

    it('should use correct cache key embedding both uid and salesRepId', async () => {
      cacheHit(mockRetailer);

      await service.findAssignedByUid(uid, salesRepId);

      expect(mockRedisService.getOrSet).toHaveBeenCalledWith(
        `retailers:rep:${salesRepId}:uid:${uid}`,
        expect.any(Function),
        60,
      );
    });

    it('should return wrapped retailer on cache hit', async () => {
      cacheHit(mockRetailer);

      const result = await service.findAssignedByUid(uid, salesRepId);

      expect(result.data).toEqual(mockRetailer);
      expect(result.message).toBe(`Retailer ${uid} fetched successfully`);
      expect(mockRetailersRepo.findByUidForSalesRep).not.toHaveBeenCalled();
    });

    it('should call repo with uid and salesRepId on cache miss', async () => {
      cacheMiss();
      mockRetailersRepo.findByUidForSalesRep.mockResolvedValue(mockRetailer);

      await service.findAssignedByUid(uid, salesRepId);

      expect(mockRetailersRepo.findByUidForSalesRep).toHaveBeenCalledWith(
        uid,
        salesRepId,
      );
    });

    it('should throw NotFoundException when retailer not found or not assigned', async () => {
      cacheMiss();
      mockRetailersRepo.findByUidForSalesRep.mockResolvedValue(null);

      await expect(
        service.findAssignedByUid('RET-9999999', salesRepId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findAssignedByUid('RET-9999999', salesRepId),
      ).rejects.toThrow('"RET-9999999" not found or not assigned to you');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  updateAssigned
  // ═══════════════════════════════════════════════════════════════════════

  describe('updateAssigned', () => {
    const uid = 'RET-0000001';
    const salesRepId = 'sr-uuid-123';

    it('should throw NotFoundException when retailer is not found / not assigned', async () => {
      mockRetailersRepo.findByUidForSalesRep.mockResolvedValue(null);

      await expect(
        service.updateAssigned(uid, salesRepId, { points: 100 }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateAssigned(uid, salesRepId, { points: 100 }),
      ).rejects.toThrow('"RET-0000001" not found or not assigned to you');
    });

    it('should update points, routes, and notes when all provided', async () => {
      const existing = { ...mockRetailer };
      mockRetailersRepo.findByUidForSalesRep.mockResolvedValue(existing);
      mockRetailersRepo.save.mockResolvedValue({ ...existing, points: 1500, routes: 'Route-15', notes: 'VIP' });

      const dto: UpdateRetailerDto = { points: 1500, routes: 'Route-15', notes: 'VIP' };
      const result = await service.updateAssigned(uid, salesRepId, dto);

      expect(existing.points).toBe(1500);
      expect(existing.routes).toBe('Route-15');
      expect(existing.notes).toBe('VIP');
      expect(mockRetailersRepo.save).toHaveBeenCalledWith(existing);
      expect(result.message).toBe(`Retailer ${uid} updated successfully`);
    });

    it('should only patch provided fields — omitted fields stay unchanged', async () => {
      const existing = { ...mockRetailer, points: 500, routes: 'Route-5', notes: 'Old note' };
      mockRetailersRepo.findByUidForSalesRep.mockResolvedValue(existing);
      mockRetailersRepo.save.mockResolvedValue(existing);

      // Only updating points, not routes or notes
      await service.updateAssigned(uid, salesRepId, { points: 999 });

      expect(existing.points).toBe(999);
      expect(existing.routes).toBe('Route-5'); // unchanged
      expect(existing.notes).toBe('Old note'); // unchanged
    });

    it('should invalidate cache after save', async () => {
      const existing = { ...mockRetailer };
      mockRetailersRepo.findByUidForSalesRep.mockResolvedValue(existing);
      mockRetailersRepo.save.mockResolvedValue(existing);

      await service.updateAssigned(uid, salesRepId, { points: 100 });

      expect(mockRedisService.delPattern).toHaveBeenCalledWith('retailers:*');
    });

    it('should return wrapped updated retailer', async () => {
      const existing = { ...mockRetailer };
      const updated = { ...existing, points: 2000 };
      mockRetailersRepo.findByUidForSalesRep.mockResolvedValue(existing);
      mockRetailersRepo.save.mockResolvedValue(updated);

      const result = await service.updateAssigned(uid, salesRepId, { points: 2000 });

      expect(result.data).toEqual(updated);
    });

    it('should call findByUidForSalesRep with correct args', async () => {
      mockRetailersRepo.findByUidForSalesRep.mockResolvedValue(null);

      await service
        .updateAssigned('RET-XYZ', 'sr-abc', { points: 1 })
        .catch(() => {});

      expect(mockRetailersRepo.findByUidForSalesRep).toHaveBeenCalledWith(
        'RET-XYZ',
        'sr-abc',
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  importFromCsv
  // ═══════════════════════════════════════════════════════════════════════

  describe('importFromCsv', () => {
    // ── Shared CSV fixture ─────────────────────────────────────────────
    const makeCsvRow = (overrides = {}) => ({
      uid: 'RET-0100001',
      name: 'Test Store',
      phone: '01712345678',
      region_name: 'Dhaka',
      area_name: 'Gulshan',
      distributor_name: 'AB Trading',
      territory_name: 'Gulshan - Zone 1',
      points: '100',
      routes: 'Route-1',
      notes: '',
      ...overrides,
    });

    const makeFile = (overrides: Partial<Express.Multer.File> = {}) =>
      ({
        originalname: 'retailers.csv',
        size: 1024,
        buffer: Buffer.from('content'),
        ...overrides,
      } as any as Express.Multer.File);

    const setupLookups = () => {
      mockRegionRepo.findAll.mockResolvedValue([
        { id: 'region-uuid', name: 'Dhaka' },
      ]);
      mockAreaRepo.findAll.mockResolvedValue([
        { id: 'area-uuid', name: 'Gulshan' },
      ]);
      mockDistributorRepo.findAll.mockResolvedValue([
        { id: 'dist-uuid', name: 'AB Trading' },
      ]);
      mockTerritoryRepo.findAll.mockResolvedValue([
        { id: 'terr-uuid', name: 'Gulshan - Zone 1' },
      ]);
    };

    // ── File validation ────────────────────────────────────────────────

    it('should throw BadRequestException when file is undefined', async () => {
      await expect(
        service.importFromCsv(undefined as any),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.importFromCsv(undefined as any),
      ).rejects.toThrow('CSV file is required');
    });

    it('should throw BadRequestException for non-csv file extension', async () => {
      const file = makeFile({ originalname: 'retailers.xlsx' });
      await expect(service.importFromCsv(file)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.importFromCsv(file)).rejects.toThrow(
        'Only .csv files are allowed',
      );
    });

    it('should throw BadRequestException when file exceeds 5 MB', async () => {
      const file = makeFile({ size: 6 * 1024 * 1024 });
      await expect(service.importFromCsv(file)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.importFromCsv(file)).rejects.toThrow(
        'File size must be under 5MB',
      );
    });

    it('should throw BadRequestException when CSV has zero rows', async () => {
      (csvParser.parseCsv as jest.Mock).mockResolvedValue([]);

      await expect(service.importFromCsv(makeFile())).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.importFromCsv(makeFile())).rejects.toThrow(
        'CSV file is empty',
      );
    });

    it('should throw BadRequestException when required columns are missing', async () => {
      // Row missing distributor_name and territory_name
      (csvParser.parseCsv as jest.Mock).mockResolvedValue([
        { uid: 'RET-1', name: 'Store', phone: '01712345678', region_name: 'Dhaka', area_name: 'Gulshan' },
      ]);

      await expect(service.importFromCsv(makeFile())).rejects.toThrow(
        'Missing required columns',
      );
    });

    // ── Happy-path: all inserts ────────────────────────────────────────

    it('should insert new retailers and return correct counts', async () => {
      (csvParser.parseCsv as jest.Mock).mockResolvedValue([makeCsvRow()]);
      setupLookups();
      mockRetailersRepo.findByUids.mockResolvedValue(new Map());
      mockRetailersRepo.saveManyInChunks.mockResolvedValue([]);
      mockRedisService.delPattern.mockResolvedValue(undefined);

      const result = await service.importFromCsv(makeFile());

      expect(result.total).toBe(1);
      expect(result.inserted).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should update an existing retailer when uid already in db', async () => {
      (csvParser.parseCsv as jest.Mock).mockResolvedValue([makeCsvRow()]);
      setupLookups();
      // existing retailer found in db
      mockRetailersRepo.findByUids.mockResolvedValue(
        new Map([['RET-0100001', { ...mockRetailer, uid: 'RET-0100001' }]]),
      );
      mockRetailersRepo.saveManyInChunks.mockResolvedValue([]);
      mockRedisService.delPattern.mockResolvedValue(undefined);

      const result = await service.importFromCsv(makeFile());

      expect(result.updated).toBe(1);
      expect(result.inserted).toBe(0);
    });

    // ── Row-level validation failures ──────────────────────────────────

    it('should fail a row with an invalid phone number', async () => {
      (csvParser.parseCsv as jest.Mock).mockResolvedValue([
        makeCsvRow({ phone: '12345678901' }), // does not match ^01[3-9]\d{8}$
      ]);
      setupLookups();
      mockRetailersRepo.findByUids.mockResolvedValue(new Map());
      mockRedisService.delPattern.mockResolvedValue(undefined);

      const result = await service.importFromCsv(makeFile());

      expect(result.failed).toBe(1);
      expect(result.inserted).toBe(0);
      expect(result.errors[0].errors).toContainEqual(
        expect.stringContaining('Invalid phone'),
      );
    });

    it('should fail a row when region is not found in lookup', async () => {
      (csvParser.parseCsv as jest.Mock).mockResolvedValue([
        makeCsvRow({ region_name: 'Unknown Region' }),
      ]);
      setupLookups(); // 'unknown region' won't be in the map
      mockRetailersRepo.findByUids.mockResolvedValue(new Map());
      mockRedisService.delPattern.mockResolvedValue(undefined);

      const result = await service.importFromCsv(makeFile());

      expect(result.failed).toBe(1);
      const errMessages = result.errors[0].errors;
      expect(errMessages).toContainEqual(
        expect.stringContaining('Region "Unknown Region" not found'),
      );
    });

    it('should fail a row missing uid, name, and phone', async () => {
      (csvParser.parseCsv as jest.Mock).mockResolvedValue([
        makeCsvRow({ uid: '', name: '', phone: '' }),
      ]);
      setupLookups();
      mockRetailersRepo.findByUids.mockResolvedValue(new Map());
      mockRedisService.delPattern.mockResolvedValue(undefined);

      const result = await service.importFromCsv(makeFile());

      expect(result.failed).toBe(1);
      const errors = result.errors[0].errors;
      expect(errors).toContain('uid is required');
      expect(errors).toContain('name is required');
      expect(errors).toContain('phone is required');
    });

    it('should process mixed valid and invalid rows correctly', async () => {
      (csvParser.parseCsv as jest.Mock).mockResolvedValue([
        makeCsvRow({ uid: 'RET-GOOD-1' }),          // valid → insert
        makeCsvRow({ uid: 'RET-BAD', phone: 'bad' }), // invalid phone → fail
        makeCsvRow({ uid: 'RET-GOOD-2' }),          // valid → insert
      ]);
      setupLookups();
      mockRetailersRepo.findByUids.mockResolvedValue(new Map());
      mockRetailersRepo.saveManyInChunks.mockResolvedValue([]);
      mockRedisService.delPattern.mockResolvedValue(undefined);

      const result = await service.importFromCsv(makeFile());

      expect(result.total).toBe(3);
      expect(result.inserted).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].uid).toBe('RET-BAD');
    });

    // ── Cache invalidation ─────────────────────────────────────────────

    it('should invalidate cache after import regardless of row results', async () => {
      (csvParser.parseCsv as jest.Mock).mockResolvedValue([makeCsvRow()]);
      setupLookups();
      mockRetailersRepo.findByUids.mockResolvedValue(new Map());
      mockRetailersRepo.saveManyInChunks.mockResolvedValue([]);
      mockRedisService.delPattern.mockResolvedValue(undefined);

      await service.importFromCsv(makeFile());

      expect(mockRedisService.delPattern).toHaveBeenCalledWith('retailers:*');
    });

    it('should default points to 0 for new retailer when not provided in CSV', async () => {
      const rowWithoutPoints = makeCsvRow({ points: '' });
      (csvParser.parseCsv as jest.Mock).mockResolvedValue([rowWithoutPoints]);
      setupLookups();
      mockRetailersRepo.findByUids.mockResolvedValue(new Map());
      mockRetailersRepo.saveManyInChunks.mockResolvedValue([]);
      mockRedisService.delPattern.mockResolvedValue(undefined);

      await service.importFromCsv(makeFile());

      const [saved] = mockRetailersRepo.saveManyInChunks.mock.calls[0][0];
      expect(saved.points).toBe(0);
    });
  });
});
