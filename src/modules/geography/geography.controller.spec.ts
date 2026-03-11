import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { GeographyController } from './geography.controller';
import { GeographyService } from './geography.service';
import {
  CreateRegionDto,
  UpdateRegionDto,
  CreateAreaDto,
  UpdateAreaDto,
  CreateDistributorDto,
  UpdateDistributorDto,
  CreateTerritoryDto,
  UpdateTerritoryDto,
} from './dtos/geography.dto';

describe('GeographyController', () => {
  let controller: GeographyController;
  let service: GeographyService;

  const mockGeographyService = {
    // Regions
    findAllRegions: jest.fn(),
    findOneRegion: jest.fn(),
    createRegion: jest.fn(),
    updateRegion: jest.fn(),
    deleteRegion: jest.fn(),
    // Areas
    findAllAreas: jest.fn(),
    findOneArea: jest.fn(),
    createArea: jest.fn(),
    updateArea: jest.fn(),
    deleteArea: jest.fn(),
    // Distributors
    findAllDistributors: jest.fn(),
    findOneDistributor: jest.fn(),
    createDistributor: jest.fn(),
    updateDistributor: jest.fn(),
    deleteDistributor: jest.fn(),
    // Territories
    findAllTerritories: jest.fn(),
    findOneTerritory: jest.fn(),
    createTerritory: jest.fn(),
    updateTerritory: jest.fn(),
    deleteTerritory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeographyController],
      providers: [
        { provide: GeographyService, useValue: mockGeographyService },
      ],
    }).compile();

    controller = module.get<GeographyController>(GeographyController);
    service = module.get<GeographyService>(GeographyService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  REGIONS
  // ═══════════════════════════════════════════════════════════════════════

  describe('findAllRegions', () => {
    it('should call geographyService.findAllRegions and return result', async () => {
      const mockRegions = [{ id: 'r-1', name: 'Dhaka' }, { id: 'r-2', name: 'Chittagong' }];
      mockGeographyService.findAllRegions.mockResolvedValue(mockRegions);

      const result = await controller.findAllRegions();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAllRegions).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRegions);
    });

    it('should return empty array when no regions exist', async () => {
      mockGeographyService.findAllRegions.mockResolvedValue([]);

      const result = await controller.findAllRegions();

      expect(result).toEqual([]);
    });
  });

  describe('findOneRegion', () => {
    const mockRegion = { id: 'r-uuid', name: 'Dhaka', areas: [] };

    it('should call geographyService.findOneRegion with the id', async () => {
      mockGeographyService.findOneRegion.mockResolvedValue({
        message: 'Region #r-uuid found successfully',
        data: mockRegion,
      });

      await controller.findOneRegion('r-uuid');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findOneRegion).toHaveBeenCalledWith('r-uuid');
    });

    it('should return the region wrapped in message+data', async () => {
      const wrapped = { message: 'Region #r-uuid found successfully', data: mockRegion };
      mockGeographyService.findOneRegion.mockResolvedValue(wrapped);

      const result = await controller.findOneRegion('r-uuid');

      expect(result).toEqual(wrapped);
    });

    it('should propagate NotFoundException when region not found', async () => {
      mockGeographyService.findOneRegion.mockRejectedValue(
        new NotFoundException('Region #bad-id not found'),
      );

      await expect(controller.findOneRegion('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createRegion', () => {
    const dto: CreateRegionDto = { name: 'Dhaka' };
    const mockCreated = { id: 'r-new', name: 'Dhaka' };

    it('should call geographyService.createRegion with the dto', async () => {
      mockGeographyService.createRegion.mockResolvedValue({
        message: 'Region created successfully',
        data: mockCreated,
      });

      await controller.createRegion(dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.createRegion).toHaveBeenCalledWith(dto);
    });

    it('should return created region wrapped in message+data', async () => {
      const wrapped = { message: 'Region created successfully', data: mockCreated };
      mockGeographyService.createRegion.mockResolvedValue(wrapped);

      const result = await controller.createRegion(dto);

      expect(result).toEqual(wrapped);
    });

    it('should propagate ConflictException for duplicate name', async () => {
      mockGeographyService.createRegion.mockRejectedValue(
        new ConflictException('Region "Dhaka" already exists'),
      );

      await expect(controller.createRegion(dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateRegion', () => {
    const dto: UpdateRegionDto = { name: 'Dhaka North' };

    it('should call geographyService.updateRegion with id and dto', async () => {
      mockGeographyService.updateRegion.mockResolvedValue({
        message: 'Region #r-uuid updated successfully',
        data: { id: 'r-uuid', name: 'Dhaka North' },
      });

      await controller.updateRegion('r-uuid', dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.updateRegion).toHaveBeenCalledWith('r-uuid', dto);
    });

    it('should propagate NotFoundException when region not found', async () => {
      mockGeographyService.updateRegion.mockRejectedValue(
        new NotFoundException('Region #bad not found'),
      );

      await expect(controller.updateRegion('bad', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteRegion', () => {
    it('should call geographyService.deleteRegion with id', async () => {
      mockGeographyService.deleteRegion.mockResolvedValue({
        message: 'Region #r-uuid deleted successfully',
      });

      await controller.deleteRegion('r-uuid');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.deleteRegion).toHaveBeenCalledWith('r-uuid');
    });

    it('should return deletion confirmation message', async () => {
      mockGeographyService.deleteRegion.mockResolvedValue({
        message: 'Region #r-uuid deleted successfully',
      });

      const result = await controller.deleteRegion('r-uuid');

      expect(result).toHaveProperty('message');
    });

    it('should propagate NotFoundException when region not found', async () => {
      mockGeographyService.deleteRegion.mockRejectedValue(
        new NotFoundException('Region #bad not found'),
      );

      await expect(controller.deleteRegion('bad')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  AREAS
  // ═══════════════════════════════════════════════════════════════════════

  describe('findAllAreas', () => {
    const mockAreas = [{ id: 'a-1', name: 'Gulshan' }];

    it('should call service.findAllAreas with no region_id when not provided', async () => {
      mockGeographyService.findAllAreas.mockResolvedValue(mockAreas);

      await controller.findAllAreas();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAllAreas).toHaveBeenCalledWith(undefined);
    });

    it('should call service.findAllAreas with region_id when provided', async () => {
      mockGeographyService.findAllAreas.mockResolvedValue(mockAreas);

      await controller.findAllAreas('r-uuid');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAllAreas).toHaveBeenCalledWith('r-uuid');
    });

    it('should return area list', async () => {
      mockGeographyService.findAllAreas.mockResolvedValue(mockAreas);

      const result = await controller.findAllAreas();

      expect(result).toEqual(mockAreas);
    });
  });

  describe('findOneArea', () => {
    it('should call service.findOneArea with id and return result', async () => {
      const wrapped = { message: 'Area #a-uuid found successfully', data: { id: 'a-uuid' } };
      mockGeographyService.findOneArea.mockResolvedValue(wrapped);

      const result = await controller.findOneArea('a-uuid');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findOneArea).toHaveBeenCalledWith('a-uuid');
      expect(result).toEqual(wrapped);
    });

    it('should propagate NotFoundException', async () => {
      mockGeographyService.findOneArea.mockRejectedValue(
        new NotFoundException('Area #bad not found'),
      );

      await expect(controller.findOneArea('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createArea', () => {
    const dto: CreateAreaDto = { name: 'Gulshan', region_id: 'r-uuid' };

    it('should call service.createArea with dto', async () => {
      mockGeographyService.createArea.mockResolvedValue({
        message: 'Area created successfully',
        data: { id: 'a-new', ...dto },
      });

      await controller.createArea(dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.createArea).toHaveBeenCalledWith(dto);
    });

    it('should propagate NotFoundException when parent region not found', async () => {
      mockGeographyService.createArea.mockRejectedValue(
        new NotFoundException('Region #r-uuid not found'),
      );

      await expect(controller.createArea(dto)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ConflictException for duplicate area name in region', async () => {
      mockGeographyService.createArea.mockRejectedValue(
        new ConflictException('Area "Gulshan" already exists in this region'),
      );

      await expect(controller.createArea(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateArea', () => {
    const dto: UpdateAreaDto = { name: 'Gulshan North' };

    it('should call service.updateArea with id and dto', async () => {
      mockGeographyService.updateArea.mockResolvedValue({
        message: 'Area #a-uuid updated successfully',
        data: { id: 'a-uuid', name: 'Gulshan North' },
      });

      await controller.updateArea('a-uuid', dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.updateArea).toHaveBeenCalledWith('a-uuid', dto);
    });

    it('should propagate NotFoundException when area not found', async () => {
      mockGeographyService.updateArea.mockRejectedValue(
        new NotFoundException('Area #bad not found'),
      );

      await expect(controller.updateArea('bad', dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteArea', () => {
    it('should call service.deleteArea with id and return message', async () => {
      mockGeographyService.deleteArea.mockResolvedValue({
        message: 'Area #a-uuid deleted successfully',
      });

      const result = await controller.deleteArea('a-uuid');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.deleteArea).toHaveBeenCalledWith('a-uuid');
      expect(result).toHaveProperty('message');
    });

    it('should propagate NotFoundException when area not found', async () => {
      mockGeographyService.deleteArea.mockRejectedValue(
        new NotFoundException('Area #bad not found'),
      );

      await expect(controller.deleteArea('bad')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  DISTRIBUTORS
  // ═══════════════════════════════════════════════════════════════════════

  describe('findAllDistributors', () => {
    it('should call service.findAllDistributors and return result', async () => {
      const mockList = [{ id: 'd-1', name: 'AB Trading' }];
      mockGeographyService.findAllDistributors.mockResolvedValue(mockList);

      const result = await controller.findAllDistributors();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAllDistributors).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockList);
    });
  });

  describe('findOneDistributor', () => {
    it('should call service.findOneDistributor with id and return wrapped result', async () => {
      const wrapped = {
        message: 'Distributor #d-uuid found successfully',
        data: { id: 'd-uuid', name: 'AB Trading' },
      };
      mockGeographyService.findOneDistributor.mockResolvedValue(wrapped);

      const result = await controller.findOneDistributor('d-uuid');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findOneDistributor).toHaveBeenCalledWith('d-uuid');
      expect(result).toEqual(wrapped);
    });

    it('should propagate NotFoundException', async () => {
      mockGeographyService.findOneDistributor.mockRejectedValue(
        new NotFoundException('Distributor #bad not found'),
      );

      await expect(controller.findOneDistributor('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createDistributor', () => {
    const dto: CreateDistributorDto = { name: 'AB Trading', phone: '01712345678' };

    it('should call service.createDistributor with dto', async () => {
      mockGeographyService.createDistributor.mockResolvedValue({
        message: 'Distributor created successfully',
        data: { id: 'd-new', ...dto },
      });

      await controller.createDistributor(dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.createDistributor).toHaveBeenCalledWith(dto);
    });

    it('should propagate ConflictException for duplicate name', async () => {
      mockGeographyService.createDistributor.mockRejectedValue(
        new ConflictException('Distributor "AB Trading" already exists'),
      );

      await expect(controller.createDistributor(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateDistributor', () => {
    const dto: UpdateDistributorDto = { phone: '01898765432' };

    it('should call service.updateDistributor with id and dto', async () => {
      mockGeographyService.updateDistributor.mockResolvedValue({
        message: 'Distributor #d-uuid updated successfully',
        data: { id: 'd-uuid', name: 'AB Trading', phone: '01898765432' },
      });

      await controller.updateDistributor('d-uuid', dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.updateDistributor).toHaveBeenCalledWith('d-uuid', dto);
    });

    it('should propagate NotFoundException when distributor not found', async () => {
      mockGeographyService.updateDistributor.mockRejectedValue(
        new NotFoundException('Distributor #bad not found'),
      );

      await expect(controller.updateDistributor('bad', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteDistributor', () => {
    it('should call service.deleteDistributor with id', async () => {
      mockGeographyService.deleteDistributor.mockResolvedValue({
        message: 'Distributor #d-uuid deleted successfully',
      });

      const result = await controller.deleteDistributor('d-uuid');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.deleteDistributor).toHaveBeenCalledWith('d-uuid');
      expect(result).toHaveProperty('message');
    });

    it('should propagate NotFoundException', async () => {
      mockGeographyService.deleteDistributor.mockRejectedValue(
        new NotFoundException('Distributor #bad not found'),
      );

      await expect(controller.deleteDistributor('bad')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  TERRITORIES
  // ═══════════════════════════════════════════════════════════════════════

  describe('findAllTerritories', () => {
    const mockTerritories = [{ id: 't-1', name: 'Gulshan - Zone 1' }];

    it('should call service.findAllTerritories with no area_id when not provided', async () => {
      mockGeographyService.findAllTerritories.mockResolvedValue(mockTerritories);

      await controller.findAllTerritories();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAllTerritories).toHaveBeenCalledWith(undefined);
    });

    it('should call service.findAllTerritories with area_id when provided', async () => {
      mockGeographyService.findAllTerritories.mockResolvedValue(mockTerritories);

      await controller.findAllTerritories('a-uuid');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAllTerritories).toHaveBeenCalledWith('a-uuid');
    });

    it('should return territory list', async () => {
      mockGeographyService.findAllTerritories.mockResolvedValue(mockTerritories);

      const result = await controller.findAllTerritories();

      expect(result).toEqual(mockTerritories);
    });
  });

  describe('findOneTerritory', () => {
    it('should call service.findOneTerritory with id and return wrapped result', async () => {
      const wrapped = {
        message: 'Territory #t-uuid found successfully',
        data: { id: 't-uuid', name: 'Gulshan - Zone 1' },
      };
      mockGeographyService.findOneTerritory.mockResolvedValue(wrapped);

      const result = await controller.findOneTerritory('t-uuid');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findOneTerritory).toHaveBeenCalledWith('t-uuid');
      expect(result).toEqual(wrapped);
    });

    it('should propagate NotFoundException', async () => {
      mockGeographyService.findOneTerritory.mockRejectedValue(
        new NotFoundException('Territory #bad not found'),
      );

      await expect(controller.findOneTerritory('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTerritory', () => {
    const dto: CreateTerritoryDto = { name: 'Gulshan - Zone 1', area_id: 'a-uuid' };

    it('should call service.createTerritory with dto', async () => {
      mockGeographyService.createTerritory.mockResolvedValue({
        message: 'Territory created successfully',
        data: { id: 't-new', ...dto },
      });

      await controller.createTerritory(dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.createTerritory).toHaveBeenCalledWith(dto);
    });

    it('should propagate NotFoundException when parent area not found', async () => {
      mockGeographyService.createTerritory.mockRejectedValue(
        new NotFoundException('Area #a-uuid not found'),
      );

      await expect(controller.createTerritory(dto)).rejects.toThrow(NotFoundException);
    });

    it('should propagate ConflictException for duplicate territory in area', async () => {
      mockGeographyService.createTerritory.mockRejectedValue(
        new ConflictException('Territory "Gulshan - Zone 1" already exists in this area'),
      );

      await expect(controller.createTerritory(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateTerritory', () => {
    const dto: UpdateTerritoryDto = { name: 'Gulshan - Zone 2' };

    it('should call service.updateTerritory with id and dto', async () => {
      mockGeographyService.updateTerritory.mockResolvedValue({
        message: 'Territory #t-uuid updated successfully',
        data: { id: 't-uuid', name: 'Gulshan - Zone 2' },
      });

      await controller.updateTerritory('t-uuid', dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.updateTerritory).toHaveBeenCalledWith('t-uuid', dto);
    });

    it('should propagate NotFoundException when territory not found', async () => {
      mockGeographyService.updateTerritory.mockRejectedValue(
        new NotFoundException('Territory #bad not found'),
      );

      await expect(controller.updateTerritory('bad', dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTerritory', () => {
    it('should call service.deleteTerritory with id', async () => {
      mockGeographyService.deleteTerritory.mockResolvedValue({
        message: 'Territory #t-uuid deleted successfully',
      });

      const result = await controller.deleteTerritory('t-uuid');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.deleteTerritory).toHaveBeenCalledWith('t-uuid');
      expect(result).toHaveProperty('message');
    });

    it('should propagate NotFoundException', async () => {
      mockGeographyService.deleteTerritory.mockRejectedValue(
        new NotFoundException('Territory #bad not found'),
      );

      await expect(controller.deleteTerritory('bad')).rejects.toThrow(NotFoundException);
    });
  });
});
