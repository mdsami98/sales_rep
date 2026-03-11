import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { GeographyService } from './geography.service';
import { RegionsRepository } from 'src/core/repositories/regions.repository';
import { AreasRepository } from 'src/core/repositories/area.repository';
import { DistributorsRepository } from 'src/core/repositories/distributors.repository';
import { TerritoriesRepository } from 'src/core/repositories/territories.repository';
import { RedisService } from '../redis/redis.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockRegionRepo = {
  getAllRegions: jest.fn(),
  getRegionWithAreas: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const mockAreaRepo = {
  getAllAreas: jest.fn(),
  getAreaWithRelations: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const mockDistributorRepo = {
  getAllDistributors: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const mockTerritoryRepo = {
  getAllTerritories: jest.fn(),
  getTerritoryWithRelations: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const mockRedisService = {
  getOrSet: jest.fn(),
  del: jest.fn(),
  delPattern: jest.fn(),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Cache miss — runs the factory immediately. */
const cacheMiss = () =>
  mockRedisService.getOrSet.mockImplementation(
    async (_key: string, factory: () => Promise<unknown>) => factory(),
  );

/** Cache hit — returns pre-cached value without calling the factory. */
const cacheHit = (value: unknown) =>
  mockRedisService.getOrSet.mockResolvedValue(value);

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('GeographyService', () => {
  let service: GeographyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeographyService,
        { provide: RegionsRepository, useValue: mockRegionRepo },
        { provide: AreasRepository, useValue: mockAreaRepo },
        { provide: DistributorsRepository, useValue: mockDistributorRepo },
        { provide: TerritoriesRepository, useValue: mockTerritoryRepo },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<GeographyService>(GeographyService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  findAllRegions
  // ═══════════════════════════════════════════════════════════════════════

  describe('findAllRegions', () => {
    it('should use "geography:regions:all" as cache key with 600 s TTL', async () => {
      cacheHit([]);

      await service.findAllRegions();

      expect(mockRedisService.getOrSet).toHaveBeenCalledWith(
        'geography:regions:all',
        expect.any(Function),
        600,
      );
    });

    it('should return cached value without hitting the repo (cache hit)', async () => {
      const cached = [{ id: 'r-1', name: 'Dhaka' }];
      cacheHit(cached);

      const result = await service.findAllRegions();

      expect(result).toEqual(cached);
      expect(mockRegionRepo.getAllRegions).not.toHaveBeenCalled();
    });

    it('should call repo.getAllRegions on cache miss', async () => {
      cacheMiss();
      const regions = [{ id: 'r-1', name: 'Dhaka' }];
      mockRegionRepo.getAllRegions.mockResolvedValue(regions);

      const result = await service.findAllRegions();

      expect(mockRegionRepo.getAllRegions).toHaveBeenCalledTimes(1);
      expect(result).toEqual(regions);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  findOneRegion
  // ═══════════════════════════════════════════════════════════════════════

  describe('findOneRegion', () => {
    const id = 'r-uuid';
    const mockRegion = { id, name: 'Dhaka', areas: [] };

    it('should use per-id cache key', async () => {
      cacheHit(mockRegion);

      await service.findOneRegion(id);

      expect(mockRedisService.getOrSet).toHaveBeenCalledWith(
        `geography:regions:${id}`,
        expect.any(Function),
        600,
      );
    });

    it('should return wrapped { message, data } on cache hit', async () => {
      cacheHit(mockRegion);

      const result = await service.findOneRegion(id);

      expect(result.message).toBe(`Region #${id} found successfully`);
      expect(result.data).toEqual(mockRegion);
    });

    it('should call repo.getRegionWithAreas on cache miss', async () => {
      cacheMiss();
      mockRegionRepo.getRegionWithAreas.mockResolvedValue(mockRegion);

      await service.findOneRegion(id);

      expect(mockRegionRepo.getRegionWithAreas).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when region is null', async () => {
      cacheMiss();
      mockRegionRepo.getRegionWithAreas.mockResolvedValue(null);

      await expect(service.findOneRegion('bad')).rejects.toThrow(NotFoundException);
      await expect(service.findOneRegion('bad')).rejects.toThrow('Region #bad not found');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  createRegion
  // ═══════════════════════════════════════════════════════════════════════

  describe('createRegion', () => {
    const dto = { name: 'Dhaka' };
    const created = { id: 'r-new', name: 'Dhaka' };

    it('should call repo.create and return wrapped result', async () => {
      mockRegionRepo.create.mockResolvedValue(created);
      mockRedisService.del.mockResolvedValue(undefined);

      const result = await service.createRegion(dto);

      expect(mockRegionRepo.create).toHaveBeenCalledWith(dto);
      expect(result.message).toBe('Region created successfully');
      expect(result.data).toEqual(created);
    });

    it('should invalidate ALL_REGIONS cache after create', async () => {
      mockRegionRepo.create.mockResolvedValue(created);
      mockRedisService.del.mockResolvedValue(undefined);

      await service.createRegion(dto);

      expect(mockRedisService.del).toHaveBeenCalledWith('geography:regions:all');
    });

    it('should throw ConflictException on duplicate (pg code 23505)', async () => {
      const pgError = Object.assign(new Error('unique violation'), { code: '23505' });
      mockRegionRepo.create.mockRejectedValue(pgError);

      await expect(service.createRegion(dto)).rejects.toThrow(ConflictException);
      await expect(service.createRegion(dto)).rejects.toThrow(
        'Region "Dhaka" already exists',
      );
    });

    it('should re-throw non-duplicate errors as-is', async () => {
      const dbError = Object.assign(new Error('DB down'), { code: '50000' });
      mockRegionRepo.create.mockRejectedValue(dbError);

      await expect(service.createRegion(dto)).rejects.toThrow('DB down');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  updateRegion
  // ═══════════════════════════════════════════════════════════════════════

  describe('updateRegion', () => {
    const id = 'r-uuid';
    const dto = { name: 'Dhaka North' };
    const existing = { id, name: 'Dhaka' };
    const updated = { id, name: 'Dhaka North' };

    it('should throw NotFoundException when region does not exist', async () => {
      mockRegionRepo.findById.mockResolvedValue(null);

      await expect(service.updateRegion(id, dto)).rejects.toThrow(NotFoundException);
    });

    it('should merge dto into existing and save', async () => {
      mockRegionRepo.findById.mockResolvedValue({ ...existing });
      mockRegionRepo.save.mockResolvedValue(updated);
      mockRedisService.del.mockResolvedValue(undefined);

      const result = await service.updateRegion(id, dto);

      expect(mockRegionRepo.save).toHaveBeenCalled();
      expect(result.message).toBe(`Region #${id} updated successfully`);
      expect(result.data).toEqual(updated);
    });

    it('should invalidate all-regions and per-id caches after update', async () => {
      mockRegionRepo.findById.mockResolvedValue({ ...existing });
      mockRegionRepo.save.mockResolvedValue(updated);
      mockRedisService.del.mockResolvedValue(undefined);

      await service.updateRegion(id, dto);

      expect(mockRedisService.del).toHaveBeenCalledWith('geography:regions:all');
      expect(mockRedisService.del).toHaveBeenCalledWith(`geography:regions:${id}`);
    });

    it('should throw ConflictException on duplicate name', async () => {
      mockRegionRepo.findById.mockResolvedValue({ ...existing });
      const pgError = Object.assign(new Error(), { code: '23505' });
      mockRegionRepo.save.mockRejectedValue(pgError);

      await expect(service.updateRegion(id, dto)).rejects.toThrow(ConflictException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  deleteRegion
  // ═══════════════════════════════════════════════════════════════════════

  describe('deleteRegion', () => {
    const id = 'r-uuid';
    const existing = { id, name: 'Dhaka' };

    it('should throw NotFoundException when region not found', async () => {
      mockRegionRepo.findById.mockResolvedValue(null);

      await expect(service.deleteRegion(id)).rejects.toThrow(NotFoundException);
    });

    it('should delete the region and return confirmation message', async () => {
      mockRegionRepo.findById.mockResolvedValue(existing);
      mockRegionRepo.delete.mockResolvedValue(true);
      mockRedisService.del.mockResolvedValue(undefined);

      const result = await service.deleteRegion(id);

      expect(mockRegionRepo.delete).toHaveBeenCalledWith(id);
      expect(result.message).toBe(`Region #${id} deleted successfully`);
    });

    it('should invalidate all-regions and per-id caches after delete', async () => {
      mockRegionRepo.findById.mockResolvedValue(existing);
      mockRegionRepo.delete.mockResolvedValue(true);
      mockRedisService.del.mockResolvedValue(undefined);

      await service.deleteRegion(id);

      expect(mockRedisService.del).toHaveBeenCalledWith('geography:regions:all');
      expect(mockRedisService.del).toHaveBeenCalledWith(`geography:regions:${id}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  findAllAreas
  // ═══════════════════════════════════════════════════════════════════════

  describe('findAllAreas', () => {
    it('should use ALL_AREAS key when no regionId provided', async () => {
      cacheHit([]);

      await service.findAllAreas();

      expect(mockRedisService.getOrSet).toHaveBeenCalledWith(
        'geography:areas:all',
        expect.any(Function),
        600,
      );
    });

    it('should use AREAS_BY_REGION key when regionId provided', async () => {
      cacheHit([]);

      await service.findAllAreas('r-uuid');

      expect(mockRedisService.getOrSet).toHaveBeenCalledWith(
        'geography:areas:region:r-uuid',
        expect.any(Function),
        600,
      );
    });

    it('should call repo.getAllAreas with the regionId on cache miss', async () => {
      cacheMiss();
      mockAreaRepo.getAllAreas.mockResolvedValue([]);

      await service.findAllAreas('r-uuid');

      expect(mockAreaRepo.getAllAreas).toHaveBeenCalledWith('r-uuid');
    });

    it('should return areas without hitting repo on cache hit', async () => {
      const cached = [{ id: 'a-1', name: 'Gulshan' }];
      cacheHit(cached);

      const result = await service.findAllAreas();

      expect(result).toEqual(cached);
      expect(mockAreaRepo.getAllAreas).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  findOneArea
  // ═══════════════════════════════════════════════════════════════════════

  describe('findOneArea', () => {
    const id = 'a-uuid';
    const mockArea = { id, name: 'Gulshan', region: { id: 'r-1', name: 'Dhaka' } };

    it('should return wrapped area on cache hit', async () => {
      cacheHit(mockArea);

      const result = await service.findOneArea(id);

      expect(result.message).toBe(`Area #${id} found successfully`);
      expect(result.data).toEqual(mockArea);
    });

    it('should call repo.getAreaWithRelations on cache miss', async () => {
      cacheMiss();
      mockAreaRepo.getAreaWithRelations.mockResolvedValue(mockArea);

      await service.findOneArea(id);

      expect(mockAreaRepo.getAreaWithRelations).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when area is null', async () => {
      cacheMiss();
      mockAreaRepo.getAreaWithRelations.mockResolvedValue(null);

      await expect(service.findOneArea('bad')).rejects.toThrow(NotFoundException);
      await expect(service.findOneArea('bad')).rejects.toThrow('Area #bad not found');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  createArea
  // ═══════════════════════════════════════════════════════════════════════

  describe('createArea', () => {
    const dto = { name: 'Gulshan', region_id: 'r-uuid' };
    const mockRegion = { id: 'r-uuid', name: 'Dhaka' };
    const created = { id: 'a-new', name: 'Gulshan', region_id: 'r-uuid' };

    it('should throw NotFoundException when parent region does not exist', async () => {
      mockRegionRepo.findById.mockResolvedValue(null);

      await expect(service.createArea(dto)).rejects.toThrow(NotFoundException);
      await expect(service.createArea(dto)).rejects.toThrow(
        `Region #${dto.region_id} not found`,
      );
    });

    it('should call repo.create when region exists', async () => {
      mockRegionRepo.findById.mockResolvedValue(mockRegion);
      mockAreaRepo.create.mockResolvedValue(created);
      mockRedisService.delPattern.mockResolvedValue(undefined);

      const result = await service.createArea(dto);

      expect(mockAreaRepo.create).toHaveBeenCalledWith(dto);
      expect(result.message).toBe('Area created successfully');
      expect(result.data).toEqual(created);
    });

    it('should invalidate area caches after create', async () => {
      mockRegionRepo.findById.mockResolvedValue(mockRegion);
      mockAreaRepo.create.mockResolvedValue(created);
      mockRedisService.delPattern.mockResolvedValue(undefined);

      await service.createArea(dto);

      expect(mockRedisService.delPattern).toHaveBeenCalledWith('geography:areas:*');
    });

    it('should throw ConflictException on duplicate area in region', async () => {
      mockRegionRepo.findById.mockResolvedValue(mockRegion);
      const pgError = Object.assign(new Error(), { code: '23505' });
      mockAreaRepo.create.mockRejectedValue(pgError);

      await expect(service.createArea(dto)).rejects.toThrow(ConflictException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  updateArea
  // ═══════════════════════════════════════════════════════════════════════

  describe('updateArea', () => {
    const id = 'a-uuid';
    const existing = { id, name: 'Gulshan', region_id: 'r-uuid' };
    const updated = { ...existing, name: 'Gulshan North' };

    it('should throw NotFoundException when area not found', async () => {
      mockAreaRepo.findById.mockResolvedValue(null);

      await expect(service.updateArea(id, { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should validate new region_id when provided in dto', async () => {
      mockAreaRepo.findById.mockResolvedValue({ ...existing });
      mockRegionRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateArea(id, { region_id: 'non-existent-region' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should save merged entity and return wrapped result', async () => {
      mockAreaRepo.findById.mockResolvedValue({ ...existing });
      mockAreaRepo.save.mockResolvedValue(updated);
      mockRedisService.delPattern.mockResolvedValue(undefined);
      mockRedisService.del.mockResolvedValue(undefined);

      const result = await service.updateArea(id, { name: 'Gulshan North' });

      expect(mockAreaRepo.save).toHaveBeenCalled();
      expect(result.message).toBe(`Area #${id} updated successfully`);
    });

    it('should invalidate area pattern and per-id caches after update', async () => {
      mockAreaRepo.findById.mockResolvedValue({ ...existing });
      mockAreaRepo.save.mockResolvedValue(updated);
      mockRedisService.delPattern.mockResolvedValue(undefined);
      mockRedisService.del.mockResolvedValue(undefined);

      await service.updateArea(id, { name: 'Gulshan North' });

      expect(mockRedisService.delPattern).toHaveBeenCalledWith('geography:areas:*');
      expect(mockRedisService.del).toHaveBeenCalledWith(`geography:areas:${id}`);
    });

    it('should throw ConflictException on duplicate name', async () => {
      mockAreaRepo.findById.mockResolvedValue({ ...existing });
      const pgError = Object.assign(new Error(), { code: '23505' });
      mockAreaRepo.save.mockRejectedValue(pgError);

      await expect(service.updateArea(id, { name: 'Gulshan' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  deleteArea
  // ═══════════════════════════════════════════════════════════════════════

  describe('deleteArea', () => {
    const id = 'a-uuid';
    const existing = { id, name: 'Gulshan' };

    it('should throw NotFoundException when area not found', async () => {
      mockAreaRepo.findById.mockResolvedValue(null);

      await expect(service.deleteArea(id)).rejects.toThrow(NotFoundException);
    });

    it('should delete area and return message', async () => {
      mockAreaRepo.findById.mockResolvedValue(existing);
      mockAreaRepo.delete.mockResolvedValue(true);
      mockRedisService.delPattern.mockResolvedValue(undefined);
      mockRedisService.del.mockResolvedValue(undefined);

      const result = await service.deleteArea(id);

      expect(mockAreaRepo.delete).toHaveBeenCalledWith(id);
      expect(result.message).toBe(`Area #${id} deleted successfully`);
    });

    it('should invalidate area caches after delete', async () => {
      mockAreaRepo.findById.mockResolvedValue(existing);
      mockAreaRepo.delete.mockResolvedValue(true);
      mockRedisService.delPattern.mockResolvedValue(undefined);
      mockRedisService.del.mockResolvedValue(undefined);

      await service.deleteArea(id);

      expect(mockRedisService.delPattern).toHaveBeenCalledWith('geography:areas:*');
      expect(mockRedisService.del).toHaveBeenCalledWith(`geography:areas:${id}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  findAllDistributors
  // ═══════════════════════════════════════════════════════════════════════

  describe('findAllDistributors', () => {
    it('should use ALL_DISTRIBUTORS cache key', async () => {
      cacheHit([]);

      await service.findAllDistributors();

      expect(mockRedisService.getOrSet).toHaveBeenCalledWith(
        'geography:distributors:all',
        expect.any(Function),
        600,
      );
    });

    it('should call repo on cache miss and return result', async () => {
      cacheMiss();
      const mockList = [{ id: 'd-1', name: 'AB Trading' }];
      mockDistributorRepo.getAllDistributors.mockResolvedValue(mockList);

      const result = await service.findAllDistributors();

      expect(mockDistributorRepo.getAllDistributors).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockList);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  findOneDistributor
  // ═══════════════════════════════════════════════════════════════════════

  describe('findOneDistributor', () => {
    const id = 'd-uuid';
    const mockDist = { id, name: 'AB Trading' };

    it('should return wrapped distributor on cache hit', async () => {
      cacheHit(mockDist);

      const result = await service.findOneDistributor(id);

      expect(result.message).toBe(`Distributor #${id} found successfully`);
      expect(result.data).toEqual(mockDist);
    });

    it('should call repo.findById on cache miss', async () => {
      cacheMiss();
      mockDistributorRepo.findById.mockResolvedValue(mockDist);

      await service.findOneDistributor(id);

      expect(mockDistributorRepo.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when distributor is null', async () => {
      cacheMiss();
      mockDistributorRepo.findById.mockResolvedValue(null);

      await expect(service.findOneDistributor('bad')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneDistributor('bad')).rejects.toThrow(
        'Distributor #bad not found',
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  createDistributor
  // ═══════════════════════════════════════════════════════════════════════

  describe('createDistributor', () => {
    const dto = { name: 'AB Trading', phone: '01712345678' };
    const created = { id: 'd-new', ...dto };

    it('should create distributor and return wrapped result', async () => {
      mockDistributorRepo.create.mockResolvedValue(created);
      mockRedisService.del.mockResolvedValue(undefined);

      const result = await service.createDistributor(dto);

      expect(mockDistributorRepo.create).toHaveBeenCalledWith(dto);
      expect(result.message).toBe('Distributor created successfully');
      expect(result.data).toEqual(created);
    });

    it('should invalidate ALL_DISTRIBUTORS after create', async () => {
      mockDistributorRepo.create.mockResolvedValue(created);
      mockRedisService.del.mockResolvedValue(undefined);

      await service.createDistributor(dto);

      expect(mockRedisService.del).toHaveBeenCalledWith('geography:distributors:all');
    });

    it('should throw ConflictException on duplicate name', async () => {
      const pgError = Object.assign(new Error(), { code: '23505' });
      mockDistributorRepo.create.mockRejectedValue(pgError);

      await expect(service.createDistributor(dto)).rejects.toThrow(ConflictException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  updateDistributor
  // ═══════════════════════════════════════════════════════════════════════

  describe('updateDistributor', () => {
    const id = 'd-uuid';
    const existing = { id, name: 'AB Trading', phone: '01700000000' };
    const updated = { ...existing, phone: '01898765432' };

    it('should throw NotFoundException when distributor not found', async () => {
      mockDistributorRepo.findById.mockResolvedValue(null);

      await expect(service.updateDistributor(id, {})).rejects.toThrow(NotFoundException);
    });

    it('should save merged entity and return wrapped result', async () => {
      mockDistributorRepo.findById.mockResolvedValue({ ...existing });
      mockDistributorRepo.save.mockResolvedValue(updated);
      mockRedisService.del.mockResolvedValue(undefined);

      const result = await service.updateDistributor(id, { phone: '01898765432' });

      expect(mockDistributorRepo.save).toHaveBeenCalled();
      expect(result.message).toBe(`Distributor #${id} updated successfully`);
      expect(result.data).toEqual(updated);
    });

    it('should invalidate all-distributors and per-id caches', async () => {
      mockDistributorRepo.findById.mockResolvedValue({ ...existing });
      mockDistributorRepo.save.mockResolvedValue(updated);
      mockRedisService.del.mockResolvedValue(undefined);

      await service.updateDistributor(id, { phone: '01898765432' });

      expect(mockRedisService.del).toHaveBeenCalledWith('geography:distributors:all');
      expect(mockRedisService.del).toHaveBeenCalledWith(`geography:distributors:${id}`);
    });

    it('should throw ConflictException on duplicate name', async () => {
      mockDistributorRepo.findById.mockResolvedValue({ ...existing });
      const pgError = Object.assign(new Error(), { code: '23505' });
      mockDistributorRepo.save.mockRejectedValue(pgError);

      await expect(service.updateDistributor(id, { name: 'Dup' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  deleteDistributor
  // ═══════════════════════════════════════════════════════════════════════

  describe('deleteDistributor', () => {
    const id = 'd-uuid';
    const existing = { id, name: 'AB Trading' };

    it('should throw NotFoundException when distributor not found', async () => {
      mockDistributorRepo.findById.mockResolvedValue(null);

      await expect(service.deleteDistributor(id)).rejects.toThrow(NotFoundException);
    });

    it('should delete distributor and return message', async () => {
      mockDistributorRepo.findById.mockResolvedValue(existing);
      mockDistributorRepo.delete.mockResolvedValue(true);
      mockRedisService.del.mockResolvedValue(undefined);

      const result = await service.deleteDistributor(id);

      expect(mockDistributorRepo.delete).toHaveBeenCalledWith(id);
      expect(result.message).toBe(`Distributor #${id} deleted successfully`);
    });

    it('should invalidate all-distributors and per-id caches', async () => {
      mockDistributorRepo.findById.mockResolvedValue(existing);
      mockDistributorRepo.delete.mockResolvedValue(true);
      mockRedisService.del.mockResolvedValue(undefined);

      await service.deleteDistributor(id);

      expect(mockRedisService.del).toHaveBeenCalledWith('geography:distributors:all');
      expect(mockRedisService.del).toHaveBeenCalledWith(`geography:distributors:${id}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  findAllTerritories
  // ═══════════════════════════════════════════════════════════════════════

  describe('findAllTerritories', () => {
    it('should use ALL_TERRITORIES key when no areaId provided', async () => {
      cacheHit([]);

      await service.findAllTerritories();

      expect(mockRedisService.getOrSet).toHaveBeenCalledWith(
        'geography:territories:all',
        expect.any(Function),
        600,
      );
    });

    it('should use TERRITORIES_BY_AREA key when areaId provided', async () => {
      cacheHit([]);

      await service.findAllTerritories('a-uuid');

      expect(mockRedisService.getOrSet).toHaveBeenCalledWith(
        'geography:territories:area:a-uuid',
        expect.any(Function),
        600,
      );
    });

    it('should call repo.getAllTerritories with areaId on cache miss', async () => {
      cacheMiss();
      mockTerritoryRepo.getAllTerritories.mockResolvedValue([]);

      await service.findAllTerritories('a-uuid');

      expect(mockTerritoryRepo.getAllTerritories).toHaveBeenCalledWith('a-uuid');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  findOneTerritory
  // ═══════════════════════════════════════════════════════════════════════

  describe('findOneTerritory', () => {
    const id = 't-uuid';
    const mockTerritory = { id, name: 'Gulshan - Zone 1' };

    it('should return wrapped territory on cache hit', async () => {
      cacheHit(mockTerritory);

      const result = await service.findOneTerritory(id);

      expect(result.message).toBe(`Territory #${id} found successfully`);
      expect(result.data).toEqual(mockTerritory);
    });

    it('should call repo.getTerritoryWithRelations on cache miss', async () => {
      cacheMiss();
      mockTerritoryRepo.getTerritoryWithRelations.mockResolvedValue(mockTerritory);

      await service.findOneTerritory(id);

      expect(mockTerritoryRepo.getTerritoryWithRelations).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when territory is null', async () => {
      cacheMiss();
      mockTerritoryRepo.getTerritoryWithRelations.mockResolvedValue(null);

      await expect(service.findOneTerritory('bad')).rejects.toThrow(NotFoundException);
      await expect(service.findOneTerritory('bad')).rejects.toThrow(
        'Territory #bad not found',
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  createTerritory
  // ═══════════════════════════════════════════════════════════════════════

  describe('createTerritory', () => {
    const dto = { name: 'Gulshan - Zone 1', area_id: 'a-uuid' };
    const mockArea = { id: 'a-uuid', name: 'Gulshan' };
    const created = { id: 't-new', ...dto };

    it('should throw NotFoundException when parent area does not exist', async () => {
      mockAreaRepo.findById.mockResolvedValue(null);

      await expect(service.createTerritory(dto)).rejects.toThrow(NotFoundException);
      await expect(service.createTerritory(dto)).rejects.toThrow(
        `Area #${dto.area_id} not found`,
      );
    });

    it('should call repo.create when area exists and return wrapped result', async () => {
      mockAreaRepo.findById.mockResolvedValue(mockArea);
      mockTerritoryRepo.create.mockResolvedValue(created);
      mockRedisService.delPattern.mockResolvedValue(undefined);

      const result = await service.createTerritory(dto);

      expect(mockTerritoryRepo.create).toHaveBeenCalledWith(dto);
      expect(result.message).toBe('Territory created successfully');
      expect(result.data).toEqual(created);
    });

    it('should invalidate territory caches after create', async () => {
      mockAreaRepo.findById.mockResolvedValue(mockArea);
      mockTerritoryRepo.create.mockResolvedValue(created);
      mockRedisService.delPattern.mockResolvedValue(undefined);

      await service.createTerritory(dto);

      expect(mockRedisService.delPattern).toHaveBeenCalledWith(
        'geography:territories:*',
      );
    });

    it('should throw ConflictException on duplicate territory in area', async () => {
      mockAreaRepo.findById.mockResolvedValue(mockArea);
      const pgError = Object.assign(new Error(), { code: '23505' });
      mockTerritoryRepo.create.mockRejectedValue(pgError);

      await expect(service.createTerritory(dto)).rejects.toThrow(ConflictException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  updateTerritory
  // ═══════════════════════════════════════════════════════════════════════

  describe('updateTerritory', () => {
    const id = 't-uuid';
    const existing = { id, name: 'Gulshan - Zone 1', area_id: 'a-uuid' };
    const updated = { ...existing, name: 'Gulshan - Zone 2' };

    it('should throw NotFoundException when territory not found', async () => {
      mockTerritoryRepo.findById.mockResolvedValue(null);

      await expect(service.updateTerritory(id, { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should validate new area_id when provided in dto', async () => {
      mockTerritoryRepo.findById.mockResolvedValue({ ...existing });
      mockAreaRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateTerritory(id, { area_id: 'non-existent-area' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should save and return wrapped result', async () => {
      mockTerritoryRepo.findById.mockResolvedValue({ ...existing });
      mockTerritoryRepo.save.mockResolvedValue(updated);
      mockRedisService.delPattern.mockResolvedValue(undefined);
      mockRedisService.del.mockResolvedValue(undefined);

      const result = await service.updateTerritory(id, { name: 'Gulshan - Zone 2' });

      expect(mockTerritoryRepo.save).toHaveBeenCalled();
      expect(result.message).toBe(`Territory #${id} updated successfully`);
    });

    it('should invalidate territory pattern and per-id caches', async () => {
      mockTerritoryRepo.findById.mockResolvedValue({ ...existing });
      mockTerritoryRepo.save.mockResolvedValue(updated);
      mockRedisService.delPattern.mockResolvedValue(undefined);
      mockRedisService.del.mockResolvedValue(undefined);

      await service.updateTerritory(id, { name: 'X' });

      expect(mockRedisService.delPattern).toHaveBeenCalledWith(
        'geography:territories:*',
      );
      expect(mockRedisService.del).toHaveBeenCalledWith(`geography:territories:${id}`);
    });

    it('should throw ConflictException on duplicate name in area', async () => {
      mockTerritoryRepo.findById.mockResolvedValue({ ...existing });
      const pgError = Object.assign(new Error(), { code: '23505' });
      mockTerritoryRepo.save.mockRejectedValue(pgError);

      await expect(service.updateTerritory(id, { name: 'Dup' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  deleteTerritory
  // ═══════════════════════════════════════════════════════════════════════

  describe('deleteTerritory', () => {
    const id = 't-uuid';
    const existing = { id, name: 'Gulshan - Zone 1' };

    it('should throw NotFoundException when territory not found', async () => {
      mockTerritoryRepo.findById.mockResolvedValue(null);

      await expect(service.deleteTerritory(id)).rejects.toThrow(NotFoundException);
    });

    it('should delete territory and return confirmation message', async () => {
      mockTerritoryRepo.findById.mockResolvedValue(existing);
      mockTerritoryRepo.delete.mockResolvedValue(true);
      mockRedisService.delPattern.mockResolvedValue(undefined);
      mockRedisService.del.mockResolvedValue(undefined);

      const result = await service.deleteTerritory(id);

      expect(mockTerritoryRepo.delete).toHaveBeenCalledWith(id);
      expect(result.message).toBe(`Territory #${id} deleted successfully`);
    });

    it('should invalidate territory pattern and per-id caches', async () => {
      mockTerritoryRepo.findById.mockResolvedValue(existing);
      mockTerritoryRepo.delete.mockResolvedValue(true);
      mockRedisService.delPattern.mockResolvedValue(undefined);
      mockRedisService.del.mockResolvedValue(undefined);

      await service.deleteTerritory(id);

      expect(mockRedisService.delPattern).toHaveBeenCalledWith(
        'geography:territories:*',
      );
      expect(mockRedisService.del).toHaveBeenCalledWith(`geography:territories:${id}`);
    });
  });
});
