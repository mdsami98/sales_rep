import { Test, TestingModule } from '@nestjs/testing';
import { RetailersController } from './retailer.controller';
import { RetailersService } from './retailer.service';
import { QueryRetailersDto, UpdateRetailerDto } from './dtos/retailers.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('RetailersController', () => {
  let controller: RetailersController;
  let service: RetailersService;

  const mockRetailersService = {
    findAll: jest.fn(),
    findByUid: jest.fn(),
    importFromCsv: jest.fn(),
    findAssigned: jest.fn(),
    findAssignedByUid: jest.fn(),
    updateAssigned: jest.fn(),
  };

  const mockAdminRequest = {
    user: { id: 'admin-uuid', role: 'admin' },
  };

  const mockSalesRepRequest = {
    user: { id: 'sr-uuid-123', role: 'sales_rep' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RetailersController],
      providers: [
        {
          provide: RetailersService,
          useValue: mockRetailersService,
        },
      ],
    }).compile();

    controller = module.get<RetailersController>(RetailersController);
    service = module.get<RetailersService>(RetailersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  ADMIN: GET /retailers/admin/all
  // ═══════════════════════════════════════════════════════════════════════

  describe('findAll (Admin)', () => {
    const query: QueryRetailersDto = {
      page: 1,
      limit: 20,
    };

    const mockPaginatedResponse = {
      data: [
        {
          id: 'uuid-1',
          uid: 'RET-0000001',
          name: 'Khan Store',
          phone: '01712345678',
          points: 500,
        },
        {
          id: 'uuid-2',
          uid: 'RET-0000002',
          name: 'Rahim Shop',
          phone: '01898765432',
          points: 300,
        },
      ],
      meta: { total: 100, page: 1, limit: 20, totalPages: 5 },
    };

    it('should call retailersService.findAll with the query', async () => {
      mockRetailersService.findAll.mockResolvedValue(mockPaginatedResponse);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return paginated retailers', async () => {
      mockRetailersService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockPaginatedResponse);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(100);
    });

    it('should pass search and filter params', async () => {
      const filteredQuery: QueryRetailersDto = {
        search: 'Khan',
        region_id: 'region-uuid',
        area_id: 'area-uuid',
        sort_by: 'name',
        sort_order: 'ASC',
        page: 2,
        limit: 50,
      };
      mockRetailersService.findAll.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 2, limit: 50, totalPages: 0 },
      });

      await controller.findAll(filteredQuery);

      expect(service.findAll).toHaveBeenCalledWith(filteredQuery);
    });

    it('should return empty data when no retailers match', async () => {
      const emptyResponse = {
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      };
      mockRetailersService.findAll.mockResolvedValue(emptyResponse);

      const result = await controller.findAll(query);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  ADMIN: GET /retailers/admin/:uid
  // ═══════════════════════════════════════════════════════════════════════

  describe('findByUid (Admin)', () => {
    const mockRetailer = {
      id: 'uuid-1',
      uid: 'RET-0000001',
      name: 'Khan Store',
      phone: '01712345678',
      points: 500,
      routes: 'Route-5',
      region: { id: 'r-uuid', name: 'Dhaka' },
      area: { id: 'a-uuid', name: 'Gulshan' },
      distributor: { id: 'd-uuid', name: 'AB Trading' },
      territory: { id: 't-uuid', name: 'Gulshan - Zone 1' },
    };

    it('should call retailersService.findByUid with the uid', async () => {
      mockRetailersService.findByUid.mockResolvedValue(mockRetailer);

      await controller.findByUid('RET-0000001');

      expect(service.findByUid).toHaveBeenCalledWith('RET-0000001');
      expect(service.findByUid).toHaveBeenCalledTimes(1);
    });

    it('should return the retailer detail', async () => {
      mockRetailersService.findByUid.mockResolvedValue(mockRetailer);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await controller.findByUid('RET-0000001') as any;

      expect(result).toEqual(mockRetailer);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.uid).toBe('RET-0000001');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.region.name).toBe('Dhaka');
    });

    it('should propagate NotFoundException when retailer not found', async () => {
      mockRetailersService.findByUid.mockRejectedValue(
        new NotFoundException('Retailer not found'),
      );

      await expect(controller.findByUid('RET-9999999')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findByUid('RET-9999999')).rejects.toThrow(
        'Retailer not found',
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  ADMIN: POST /retailers/import
  // ═══════════════════════════════════════════════════════════════════════

  describe('importCsv (Admin)', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mockFile = {
      fieldname: 'file',
      originalname: 'retailers.csv',
      encoding: '7bit',
      mimetype: 'text/csv',
      buffer: Buffer.from(
        'uid,name,phone,region_name,area_name,distributor_name,territory_name\nRET-0100001,Test Store,01712345678,Dhaka,Gulshan,AB Trading,Gulshan - Zone 1',
      ),
      size: 1024,
    } as any;

    it('should call retailersService.importFromCsv with the file', async () => {
      mockRetailersService.importFromCsv.mockResolvedValue({
        total: 1,
        inserted: 1,
        updated: 0,
        failed: 0,
        errors: [],
      });

      await controller.importCsv(mockFile);

      expect(service.importFromCsv).toHaveBeenCalledWith(mockFile);
      expect(service.importFromCsv).toHaveBeenCalledTimes(1);
    });

    it('should return success message with import stats', async () => {
      mockRetailersService.importFromCsv.mockResolvedValue({
        total: 5,
        inserted: 3,
        updated: 1,
        failed: 1,
        errors: [{ row: 4, uid: 'RET-BAD', errors: ['Invalid phone'] }],
      });

      const result = await controller.importCsv(mockFile);

      expect(result.message).toBe(
        'Import complete: 3 inserted, 1 updated, 1 failed',
      );
      expect(result.data.total).toBe(5);
      expect(result.data.inserted).toBe(3);
      expect(result.data.updated).toBe(1);
      expect(result.data.failed).toBe(1);
      expect(result.data.errors).toHaveLength(1);
    });

    it('should return all inserted when no errors', async () => {
      mockRetailersService.importFromCsv.mockResolvedValue({
        total: 10,
        inserted: 10,
        updated: 0,
        failed: 0,
        errors: [],
      });

      const result = await controller.importCsv(mockFile);

      expect(result.message).toBe(
        'Import complete: 10 inserted, 0 updated, 0 failed',
      );
      expect(result.data.errors).toHaveLength(0);
    });

    it('should propagate errors from service', async () => {
      mockRetailersService.importFromCsv.mockRejectedValue(
        new Error('Invalid CSV format'),
      );

      await expect(controller.importCsv(mockFile)).rejects.toThrow(
        'Invalid CSV format',
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  SR: GET /retailers
  // ═══════════════════════════════════════════════════════════════════════

  describe('findAssigned (Sales Rep)', () => {
    const query: QueryRetailersDto = {
      page: 1,
      limit: 20,
    };

    const mockAssignedResponse = {
      data: [
        {
          id: 'uuid-1',
          uid: 'RET-0000001',
          name: 'Khan Store',
          points: 500,
        },
      ],
      meta: { total: 1000, page: 1, limit: 20, totalPages: 50 },
    };

    it('should call retailersService.findAssigned with user id and query', async () => {
      mockRetailersService.findAssigned.mockResolvedValue(mockAssignedResponse);

      await controller.findAssigned(mockSalesRepRequest, query);

      expect(service.findAssigned).toHaveBeenCalledWith('sr-uuid-123', query);
      expect(service.findAssigned).toHaveBeenCalledTimes(1);
    });

    it('should return paginated assigned retailers', async () => {
      mockRetailersService.findAssigned.mockResolvedValue(mockAssignedResponse);

      const result = await controller.findAssigned(mockSalesRepRequest, query);

      expect(result).toEqual(mockAssignedResponse);
      expect(result.meta.total).toBe(1000);
    });

    it('should pass search and filter params along with user id', async () => {
      const filteredQuery: QueryRetailersDto = {
        search: 'Khan',
        region_id: 'region-uuid',
        sort_by: 'points',
        sort_order: 'DESC',
        page: 1,
        limit: 50,
      };
      mockRetailersService.findAssigned.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 50, totalPages: 0 },
      });

      await controller.findAssigned(mockSalesRepRequest, filteredQuery);

      expect(service.findAssigned).toHaveBeenCalledWith(
        'sr-uuid-123',
        filteredQuery,
      );
    });

    it('should extract user id from request object', async () => {
      mockRetailersService.findAssigned.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      const differentSr = { user: { id: 'different-sr-uuid' } };
      await controller.findAssigned(differentSr, query);

      expect(service.findAssigned).toHaveBeenCalledWith(
        'different-sr-uuid',
        query,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  SR: GET /retailers/:uid
  // ═══════════════════════════════════════════════════════════════════════

  describe('findAssignedByUid (Sales Rep)', () => {
    const mockRetailer = {
      id: 'uuid-1',
      uid: 'RET-0000001',
      name: 'Khan Store',
      phone: '01712345678',
      points: 500,
    };

    it('should call retailersService.findAssignedByUid with uid and user id', async () => {
      mockRetailersService.findAssignedByUid.mockResolvedValue(mockRetailer);

      await controller.findAssignedByUid(mockSalesRepRequest, 'RET-0000001');

      expect(service.findAssignedByUid).toHaveBeenCalledWith(
        'RET-0000001',
        'sr-uuid-123',
      );
      expect(service.findAssignedByUid).toHaveBeenCalledTimes(1);
    });

    it('should return the assigned retailer', async () => {
      mockRetailersService.findAssignedByUid.mockResolvedValue(mockRetailer);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await controller.findAssignedByUid(
        mockSalesRepRequest,
        'RET-0000001',
      ) as any;

      expect(result).toEqual(mockRetailer);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.uid).toBe('RET-0000001');
    });

    it('should propagate NotFoundException when retailer not found', async () => {
      mockRetailersService.findAssignedByUid.mockRejectedValue(
        new NotFoundException('Retailer not found'),
      );

      await expect(
        controller.findAssignedByUid(mockSalesRepRequest, 'RET-9999999'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException when retailer not assigned', async () => {
      mockRetailersService.findAssignedByUid.mockRejectedValue(
        new ForbiddenException('Retailer not assigned to you'),
      );

      await expect(
        controller.findAssignedByUid(mockSalesRepRequest, 'RET-0000001'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  SR: PATCH /retailers/:uid
  // ═══════════════════════════════════════════════════════════════════════

  describe('updateAssigned (Sales Rep)', () => {
    const updateDto: UpdateRetailerDto = {
      points: 1500,
      routes: 'Route-15, Route-22',
      notes: 'VIP customer',
    };

    const mockUpdatedRetailer = {
      id: 'uuid-1',
      uid: 'RET-0000001',
      name: 'Khan Store',
      phone: '01712345678',
      points: 1500,
      routes: 'Route-15, Route-22',
      notes: 'VIP customer',
    };

    it('should call retailersService.updateAssigned with uid, user id, and dto', async () => {
      mockRetailersService.updateAssigned.mockResolvedValue(
        mockUpdatedRetailer,
      );

      await controller.updateAssigned(
        mockSalesRepRequest,
        'RET-0000001',
        updateDto,
      );

      expect(service.updateAssigned).toHaveBeenCalledWith(
        'RET-0000001',
        'sr-uuid-123',
        updateDto,
      );
      expect(service.updateAssigned).toHaveBeenCalledTimes(1);
    });

    it('should return the updated retailer', async () => {
      mockRetailersService.updateAssigned.mockResolvedValue(
        mockUpdatedRetailer,
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await controller.updateAssigned(
        mockSalesRepRequest,
        'RET-0000001',
        updateDto,
      ) as any;

      expect(result).toEqual(mockUpdatedRetailer);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.points).toBe(1500);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.routes).toBe('Route-15, Route-22');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.notes).toBe('VIP customer');
    });

    it('should handle partial update (only points)', async () => {
      const partialDto: UpdateRetailerDto = { points: 2000 };
      mockRetailersService.updateAssigned.mockResolvedValue({
        ...mockUpdatedRetailer,
        points: 2000,
      });

      await controller.updateAssigned(
        mockSalesRepRequest,
        'RET-0000001',
        partialDto,
      );

      expect(service.updateAssigned).toHaveBeenCalledWith(
        'RET-0000001',
        'sr-uuid-123',
        partialDto,
      );
    });

    it('should propagate NotFoundException when retailer not found', async () => {
      mockRetailersService.updateAssigned.mockRejectedValue(
        new NotFoundException('Retailer not found'),
      );

      await expect(
        controller.updateAssigned(
          mockSalesRepRequest,
          'RET-9999999',
          updateDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException when not assigned', async () => {
      mockRetailersService.updateAssigned.mockRejectedValue(
        new ForbiddenException('Retailer not assigned to you'),
      );

      await expect(
        controller.updateAssigned(
          mockSalesRepRequest,
          'RET-0000001',
          updateDto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
