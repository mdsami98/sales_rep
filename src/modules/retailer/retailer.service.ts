import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { QueryRetailersDto, UpdateRetailerDto } from './dtos/retailers.dto';
import { RetailersRepository } from 'src/core/repositories/retailer.repository';
import { CsvRetailerRow, ImportResult } from './dtos/import-retailer.dto';
import { parseCsv } from 'src/common/utility/csv.parser.utility';
import { RegionsRepository } from 'src/core/repositories/regions.repository';
import { AreasRepository } from 'src/core/repositories/area.repository';
import { DistributorsRepository } from 'src/core/repositories/distributors.repository';
import { TerritoriesRepository } from 'src/core/repositories/territories.repository';

const CACHE_PREFIX = 'retailers';
const LIST_TTL = 30; // 30 seconds for list queries
const DETAIL_TTL = 60; // 60 seconds for single retailer

@Injectable()
export class RetailersService {
  constructor(
    private readonly retailersRepo: RetailersRepository,
    private readonly regionRepo: RegionsRepository,
    private readonly areaRepo: AreasRepository,
    private readonly distributorRepo: DistributorsRepository,
    private readonly territoryRepo: TerritoriesRepository,
    private readonly redisService: RedisService,
  ) {}

  // ─── HELPERS ──────────────────────────────────────────────────────────

  private buildMeta(total: number, page: number, limit: number) {
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── ADMIN: List All Retailers ────────────────────────────────────────

  async findAll(query: QueryRetailersDto) {
    const cacheKey = `${CACHE_PREFIX}:all:${JSON.stringify(query)}`;

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const { data, total, page, limit } =
          await this.retailersRepo.findAllRetailers(query);

        return {
          message: 'Retailers fetched successfully',
          data,
          meta: this.buildMeta(total, page, limit),
        };
      },
      LIST_TTL,
    );
  }

  // ─── ADMIN: Get Single Retailer ──────────────────────────────────────

  async findByUid(uid: string) {
    const cacheKey = `${CACHE_PREFIX}:uid:${uid}`;

    const retailer = await this.redisService.getOrSet(
      cacheKey,
      () => this.retailersRepo.findByUid(uid),
      DETAIL_TTL,
    );

    if (!retailer) {
      throw new NotFoundException(`Retailer "${uid}" not found`);
    }

    return {
      message: `Retailer ${uid} fetched successfully`,
      data: retailer,
    };
  }

  // ─── SR: List Assigned Retailers ──────────────────────────────────────

  async findAssigned(salesRepId: string, query: QueryRetailersDto) {
    const cacheKey = `${CACHE_PREFIX}:rep:${salesRepId}:${JSON.stringify(query)}`;

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const { data, total, page, limit } =
          await this.retailersRepo.findAssignedRetailers(salesRepId, query);

        return {
          message: 'Assigned retailers fetched successfully',
          data,
          meta: this.buildMeta(total, page, limit),
        };
      },
      LIST_TTL,
    );
  }

  // ─── SR: Get Single Assigned Retailer ─────────────────────────────────

  async findAssignedByUid(uid: string, salesRepId: string) {
    const cacheKey = `${CACHE_PREFIX}:rep:${salesRepId}:uid:${uid}`;

    const retailer = await this.redisService.getOrSet(
      cacheKey,
      () => this.retailersRepo.findByUidForSalesRep(uid, salesRepId),
      DETAIL_TTL,
    );

    if (!retailer) {
      throw new NotFoundException(
        `Retailer "${uid}" not found or not assigned to you`,
      );
    }

    return {
      message: `Retailer ${uid} fetched successfully`,
      data: retailer,
    };
  }

  // ─── SR: Update Assigned Retailer ─────────────────────────────────────

  async updateAssigned(
    uid: string,
    salesRepId: string,
    dto: UpdateRetailerDto,
  ) {
    const retailer = await this.retailersRepo.findByUidForSalesRep(
      uid,
      salesRepId,
    );

    if (!retailer) {
      throw new NotFoundException(
        `Retailer "${uid}" not found or not assigned to you`,
      );
    }

    // Only allow updating: points, routes, notes
    if (dto.points !== undefined) retailer.points = dto.points;
    if (dto.routes !== undefined) retailer.routes = dto.routes;
    if (dto.notes !== undefined) retailer.notes = dto.notes;

    const updated = await this.retailersRepo.save(retailer);

    // Invalidate related caches
    await this.redisService.delPattern(`${CACHE_PREFIX}:*`);

    return {
      message: `Retailer ${uid} updated successfully`,
      data: updated,
    };
  }

  async importFromCsv(file: Express.Multer.File): Promise<ImportResult> {
    // ─── Validate File ──────────────────────────────────────────────
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    if (!file.originalname.endsWith('.csv')) {
      throw new BadRequestException('Only .csv files are allowed');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must be under 5MB');
    }

    // ─── Parse CSV ──────────────────────────────────────────────────
    const rows = await parseCsv<CsvRetailerRow>(file.buffer);

    if (rows.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    // ─── Validate Headers ───────────────────────────────────────────
    const requiredHeaders = [
      'name',
      'phone',
      'region_name',
      'area_name',
      'distributor_name',
      'territory_name',
    ];
    const headers = Object.keys(rows[0]);
    const missing = requiredHeaders.filter((h) => !headers.includes(h));

    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required columns: ${missing.join(', ')}`,
      );
    }

    // ─── Pre-load Lookups ───────────────────────────────────────────
    const [regions, areas, distributors, territories] = await Promise.all([
      this.regionRepo.findAll(),
      this.areaRepo.findAll(),
      this.distributorRepo.findAll(),
      this.territoryRepo.findAll(),
    ]);

    const regionMap = new Map(regions.map((r) => [r.name.toLowerCase(), r.id]));
    const areaMap = new Map(areas.map((a) => [a.name.toLowerCase(), a.id]));
    const distributorMap = new Map(distributors.map((d) => [d.name.toLowerCase(), d.id]));
    const territoryMap = new Map(territories.map((t) => [t.name.toLowerCase(), t.id]));

    // Pre-load existing retailers by UID
    const uids = rows.map((r) => r.uid?.trim()).filter(Boolean);
    const existingMap = await this.retailersRepo.findByUids(uids);

    // ─── Process Rows ───────────────────────────────────────────────
    const result: ImportResult = {
      total: rows.length,
      inserted: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    const CHUNK_SIZE = 100;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const toSave: any[] = [];

      for (let j = 0; j < chunk.length; j++) {
        const row = chunk[j];
        const rowNum = i + j + 2; // +2 for header row + 0-index
        const rowErrors: string[] = [];

        // ─── Validate Fields ────────────────────────────────────
        const uid = row.uid?.trim();
        const name = row.name?.trim();
        const phone = row.phone?.trim();
        const regionName = row.region_name?.trim()?.toLowerCase();
        const areaName = row.area_name?.trim()?.toLowerCase();
        const distributorName = row.distributor_name?.trim()?.toLowerCase();
        const territoryName = row.territory_name?.trim()?.toLowerCase();

        if (!uid) rowErrors.push('uid is required');
        if (!name) rowErrors.push('name is required');
        if (!phone) rowErrors.push('phone is required');

        // ─── Resolve Foreign Keys ───────────────────────────────
        const regionId = regionMap.get(regionName);
        const areaId = areaMap.get(areaName);
        const distributorId = distributorMap.get(distributorName);
        const territoryId = territoryMap.get(territoryName);

        if (!regionId) rowErrors.push(`Region "${row.region_name}" not found`);
        if (!areaId) rowErrors.push(`Area "${row.area_name}" not found`);
        if (!distributorId) rowErrors.push(`Distributor "${row.distributor_name}" not found`);
        if (!territoryId) rowErrors.push(`Territory "${row.territory_name}" not found`);

        // ─── Phone Validation ───────────────────────────────────
        if (phone && !/^01[3-9]\d{8}$/.test(phone)) {
          rowErrors.push(`Invalid phone: "${phone}"`);
        }

        if (rowErrors.length > 0) {
          result.failed++;
          result.errors.push({ row: rowNum, uid: uid || 'N/A', errors: rowErrors });
          continue;
        }

        // ─── Build Entity ───────────────────────────────────────
        const existingRetailer = existingMap.get(uid);
        const isUpdate = !!existingRetailer;

        toSave.push({
          ...(existingRetailer ?? {}),
          uid,
          name,
          phone,
          region_id: regionId,
          area_id: areaId,
          distributor_id: distributorId,
          territory_id: territoryId,
          points: row.points
            ? parseInt(row.points, 10)
            : existingRetailer
            ? existingRetailer.points
            : 0,
          routes: row.routes?.trim() || (existingRetailer ? existingRetailer.routes : null),
          notes: row.notes?.trim() || (existingRetailer ? existingRetailer.notes : null),
        });

        if (isUpdate) {
          result.updated++;
        } else {
          result.inserted++;
        }
      }

      // ─── Bulk Save Chunk ──────────────────────────────────────
      if (toSave.length > 0) {
        await this.retailersRepo.saveManyInChunks(toSave);
      }
    }

    // ─── Clear Cache ────────────────────────────────────────────
    await this.redisService.delPattern(`${CACHE_PREFIX}:*`);

    return result;
  }
}