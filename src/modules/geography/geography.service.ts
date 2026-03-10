import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { RegionsRepository } from 'src/core/repositories/regions.repository';
import { DistributorsRepository } from 'src/core/repositories/distributors.repository';
import { TerritoriesRepository } from 'src/core/repositories/territories.repository';
import { RedisService } from '../redis/redis.service';
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
import { AreasRepository } from 'src/core/repositories/area.repository';

const CACHE_KEYS = {
  ALL_REGIONS: 'geography:regions:all',
  REGION_BY_ID: (id: string) => `geography:regions:${id}`,
  ALL_AREAS: 'geography:areas:all',
  AREAS_BY_REGION: (regionId: string) => `geography:areas:region:${regionId}`,
  AREA_BY_ID: (id: string) => `geography:areas:${id}`,
  ALL_DISTRIBUTORS: 'geography:distributors:all',
  DISTRIBUTOR_BY_ID: (id: string) => `geography:distributors:${id}`,
  ALL_TERRITORIES: 'geography:territories:all',
  TERRITORIES_BY_AREA: (areaId: string) =>
    `geography:territories:area:${areaId}`,
  TERRITORY_BY_ID: (id: string) => `geography:territories:${id}`,
};

const CACHE_TTL = 600; // 10 minutes

@Injectable()
export class GeographyService {
  constructor(
    private readonly regionRepository: RegionsRepository,
    private readonly areaRepository: AreasRepository,
    private readonly distributorRepository: DistributorsRepository,
    private readonly territoryRepository: TerritoriesRepository,
    private readonly redisService: RedisService,
  ) {}

  // ─── REGIONS ──────────────────────────────────────────────────────────────

  async findAllRegions() {
    return this.redisService.getOrSet(
      CACHE_KEYS.ALL_REGIONS,
      () => this.regionRepository.getAllRegions(),
      CACHE_TTL,
    );
  }

  async findOneRegion(id: string) {
    const region = await this.redisService.getOrSet(
      CACHE_KEYS.REGION_BY_ID(id),
      () => this.regionRepository.getRegionWithAreas(id),
      CACHE_TTL,
    );

    if (!region) throw new NotFoundException(`Region #${id} not found`);

    return { message: `Region #${id} found successfully`, data: region };
  }

  async createRegion(dto: CreateRegionDto) {
    try {
      const region = await this.regionRepository.create(dto);

      await this.redisService.del(CACHE_KEYS.ALL_REGIONS);

      return { message: 'Region created successfully', data: region };
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException(`Region "${dto.name}" already exists`);
      }
      throw err;
    }
  }

  async updateRegion(id: string, dto: UpdateRegionDto) {
    const existing = await this.regionRepository.findById(id);
    if (!existing) throw new NotFoundException(`Region #${id} not found`);

    try {
      Object.assign(existing, dto);
      const updated = await this.regionRepository.save(existing);

      await this.redisService.del(CACHE_KEYS.ALL_REGIONS);
      await this.redisService.del(CACHE_KEYS.REGION_BY_ID(id));

      return { message: `Region #${id} updated successfully`, data: updated };
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException(`Region "${dto.name}" already exists`);
      }
      throw err;
    }
  }

  async deleteRegion(id: string) {
    const existing = await this.regionRepository.findById(id);
    if (!existing) throw new NotFoundException(`Region #${id} not found`);

    await this.regionRepository.delete(id);

    await this.redisService.del(CACHE_KEYS.ALL_REGIONS);
    await this.redisService.del(CACHE_KEYS.REGION_BY_ID(id));

    return { message: `Region #${id} deleted successfully` };
  }

  // ─── AREAS ────────────────────────────────────────────────────────────────

  async findAllAreas(regionId?: string) {
    const cacheKey = regionId
      ? CACHE_KEYS.AREAS_BY_REGION(regionId)
      : CACHE_KEYS.ALL_AREAS;

    return this.redisService.getOrSet(
      cacheKey,
      () => this.areaRepository.getAllAreas(regionId),
      CACHE_TTL,
    );
  }

  async findOneArea(id: string) {
    const area = await this.redisService.getOrSet(
      CACHE_KEYS.AREA_BY_ID(id),
      () => this.areaRepository.getAreaWithRelations(id),
      CACHE_TTL,
    );

    if (!area) throw new NotFoundException(`Area #${id} not found`);

    return { message: `Area #${id} found successfully`, data: area };
  }

  async createArea(dto: CreateAreaDto) {
    // Ensure region exists
    const region = await this.regionRepository.findById(dto.region_id);
    if (!region) throw new NotFoundException(`Region #${dto.region_id} not found`);

    try {
      const area = await this.areaRepository.create(dto);

      await this.invalidateAreaCache();

      return { message: 'Area created successfully', data: area };
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException(`Area "${dto.name}" already exists in this region`);
      }
      throw err;
    }
  }

  async updateArea(id: string, dto: UpdateAreaDto) {
    const existing = await this.areaRepository.findById(id);
    if (!existing) throw new NotFoundException(`Area #${id} not found`);

    if (dto.region_id) {
      const region = await this.regionRepository.findById(dto.region_id);
      if (!region) throw new NotFoundException(`Region #${dto.region_id} not found`);
    }

    try {
      Object.assign(existing, dto);
      const updated = await this.areaRepository.save(existing);

      await this.invalidateAreaCache();
      await this.redisService.del(CACHE_KEYS.AREA_BY_ID(id));

      return { message: `Area #${id} updated successfully`, data: updated };
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException(`Area "${dto.name}" already exists in this region`);
      }
      throw err;
    }
  }

  async deleteArea(id: string) {
    const existing = await this.areaRepository.findById(id);
    if (!existing) throw new NotFoundException(`Area #${id} not found`);

    await this.areaRepository.delete(id);

    await this.invalidateAreaCache();
    await this.redisService.del(CACHE_KEYS.AREA_BY_ID(id));

    return { message: `Area #${id} deleted successfully` };
  }

  // ─── DISTRIBUTORS ─────────────────────────────────────────────────────────

  async findAllDistributors() {
    return this.redisService.getOrSet(
      CACHE_KEYS.ALL_DISTRIBUTORS,
      () => this.distributorRepository.getAllDistributors(),
      CACHE_TTL,
    );
  }

  async findOneDistributor(id: string) {
    const distributor = await this.redisService.getOrSet(
      CACHE_KEYS.DISTRIBUTOR_BY_ID(id),
      () => this.distributorRepository.findById(id),
      CACHE_TTL,
    );

    if (!distributor)
      throw new NotFoundException(`Distributor #${id} not found`);

    return {
      message: `Distributor #${id} found successfully`,
      data: distributor,
    };
  }

  async createDistributor(dto: CreateDistributorDto) {
    try {
      const distributor = await this.distributorRepository.create(dto);

      await this.redisService.del(CACHE_KEYS.ALL_DISTRIBUTORS);

      return { message: 'Distributor created successfully', data: distributor };
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException(`Distributor "${dto.name}" already exists`);
      }
      throw err;
    }
  }

  async updateDistributor(id: string, dto: UpdateDistributorDto) {
    const existing = await this.distributorRepository.findById(id);
    if (!existing) throw new NotFoundException(`Distributor #${id} not found`);

    try {
      Object.assign(existing, dto);
      const updated = await this.distributorRepository.save(existing);

      await this.redisService.del(CACHE_KEYS.ALL_DISTRIBUTORS);
      await this.redisService.del(CACHE_KEYS.DISTRIBUTOR_BY_ID(id));

      return {
        message: `Distributor #${id} updated successfully`,
        data: updated,
      };
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException(`Distributor "${dto.name}" already exists`);
      }
      throw err;
    }
  }

  async deleteDistributor(id: string) {
    const existing = await this.distributorRepository.findById(id);
    if (!existing) throw new NotFoundException(`Distributor #${id} not found`);

    await this.distributorRepository.delete(id);

    await this.redisService.del(CACHE_KEYS.ALL_DISTRIBUTORS);
    await this.redisService.del(CACHE_KEYS.DISTRIBUTOR_BY_ID(id));

    return { message: `Distributor #${id} deleted successfully` };
  }

  // ─── TERRITORIES ──────────────────────────────────────────────────────────

  async findAllTerritories(areaId?: string) {
    const cacheKey = areaId
      ? CACHE_KEYS.TERRITORIES_BY_AREA(areaId)
      : CACHE_KEYS.ALL_TERRITORIES;

    return this.redisService.getOrSet(
      cacheKey,
      () => this.territoryRepository.getAllTerritories(areaId),
      CACHE_TTL,
    );
  }

  async findOneTerritory(id: string) {
    const territory = await this.redisService.getOrSet(
      CACHE_KEYS.TERRITORY_BY_ID(id),
      () => this.territoryRepository.getTerritoryWithRelations(id),
      CACHE_TTL,
    );

    if (!territory) throw new NotFoundException(`Territory #${id} not found`);

    return { message: `Territory #${id} found successfully`, data: territory };
  }

  async createTerritory(dto: CreateTerritoryDto) {
    // Ensure area exists
    const area = await this.areaRepository.findById(dto.area_id);
    if (!area) throw new NotFoundException(`Area #${dto.area_id} not found`);

    try {
      const territory = await this.territoryRepository.create(dto);

      await this.invalidateTerritoryCache();

      return { message: 'Territory created successfully', data: territory };
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException(
          `Territory "${dto.name}" already exists in this area`,
        );
      }
      throw err;
    }
  }

  async updateTerritory(id: string, dto: UpdateTerritoryDto) {
    const existing = await this.territoryRepository.findById(id);
    if (!existing) throw new NotFoundException(`Territory #${id} not found`);

    if (dto.area_id) {
      const area = await this.areaRepository.findById(dto.area_id);
      if (!area) throw new NotFoundException(`Area #${dto.area_id} not found`);
    }

    try {
      Object.assign(existing, dto);
      const updated = await this.territoryRepository.save(existing);

      await this.invalidateTerritoryCache();
      await this.redisService.del(CACHE_KEYS.TERRITORY_BY_ID(id));

      return {
        message: `Territory #${id} updated successfully`,
        data: updated,
      };
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException(
          `Territory "${dto.name}" already exists in this area`,
        );
      }
      throw err;
    }
  }

  async deleteTerritory(id: string) {
    const existing = await this.territoryRepository.findById(id);
    if (!existing) throw new NotFoundException(`Territory #${id} not found`);

    await this.territoryRepository.delete(id);

    await this.invalidateTerritoryCache();
    await this.redisService.del(CACHE_KEYS.TERRITORY_BY_ID(id));

    return { message: `Territory #${id} deleted successfully` };
  }

  // ─── Cache Helpers ────────────────────────────────────────────────────────

  private async invalidateAreaCache() {
    await this.redisService.delPattern('geography:areas:*');
  }

  private async invalidateTerritoryCache() {
    await this.redisService.delPattern('geography:territories:*');
  }
}