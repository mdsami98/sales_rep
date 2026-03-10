import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { Retailer } from 'src/core/entities/retailer.entity';
import { QueryRetailersDto } from 'src/modules/retailer/dtos/retailers.dto';

@Injectable()
export class RetailersRepository extends BaseRepository<Retailer> {
  constructor(dataSource: DataSource) {
    super(Retailer, dataSource);
  }

  // ─── PRIVATE: Base Query ──────────────────────────────────────────────

  private baseQuery(): SelectQueryBuilder<Retailer> {
    return this.repo
      .createQueryBuilder('r')
      .leftJoin('r.region', 'region')
      .leftJoin('r.area', 'area')
      .leftJoin('r.distributor', 'distributor')
      .leftJoin('r.territory', 'territory')
      .addSelect(['region.id', 'region.name'])
      .addSelect(['area.id', 'area.name'])
      .addSelect(['distributor.id', 'distributor.name'])
      .addSelect(['territory.id', 'territory.name']);
  }

  // ─── PRIVATE: Apply Search & Filters ──────────────────────────────────

  private applyFilters(
    qb: SelectQueryBuilder<Retailer>,
    query: QueryRetailersDto,
  ): SelectQueryBuilder<Retailer> {
    // Search (name, uid, phone)
    if (query.search) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        '(r.name ILIKE :search OR r.uid ILIKE :search OR r.phone ILIKE :search)',
        { search },
      );
    }

    // Filters
    if (query.region_id) {
      qb.andWhere('r.region_id = :region_id', { region_id: query.region_id });
    }
    if (query.area_id) {
      qb.andWhere('r.area_id = :area_id', { area_id: query.area_id });
    }
    if (query.distributor_id) {
      qb.andWhere('r.distributor_id = :distributor_id', {
        distributor_id: query.distributor_id,
      });
    }
    if (query.territory_id) {
      qb.andWhere('r.territory_id = :territory_id', {
        territory_id: query.territory_id,
      });
    }

    return qb;
  }

  // ─── PRIVATE: Apply Sort & Pagination ─────────────────────────────────

  private applySortAndPagination(
    qb: SelectQueryBuilder<Retailer>,
    query: QueryRetailersDto,
  ): { qb: SelectQueryBuilder<Retailer>; page: number; limit: number } {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const sortBy = query.sort_by || 'name';
    const sortOrder = query.sort_order || 'ASC';

    const SORT_MAP: Record<string, string> = {
      name: 'r.name',
      uid: 'r.uid',
      phone: 'r.phone',
      points: 'r.points',
      created_at: 'r.created_at',
      region: 'region.name',
      area: 'area.name',
      territory: 'territory.name',
      distributor: 'distributor.name',
    };

    qb.orderBy(SORT_MAP[sortBy] || 'r.name', sortOrder);
    qb.skip((page - 1) * limit).take(limit);

    return { qb, page, limit };
  }

  // ─── ADMIN: All Retailers ─────────────────────────────────────────────

  async findAllRetailers(
    query: QueryRetailersDto,
  ): Promise<{ data: Retailer[]; total: number; page: number; limit: number }> {
    const qb = this.baseQuery();
    this.applyFilters(qb, query);
    const { page, limit } = this.applySortAndPagination(qb, query);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  // ─── SALES REP: Assigned Retailers ────────────────────────────────────

  async findAssignedRetailers(
    salesRepId: string,
    query: QueryRetailersDto,
  ): Promise<{ data: Retailer[]; total: number; page: number; limit: number }> {
    const qb = this.baseQuery();

    // Scope to assigned retailers only
    qb.innerJoin(
      'sales_rep_retailers',
      'sr',
      'sr.retailer_id = r.id AND sr.sales_rep_id = :salesRepId',
      { salesRepId },
    );

    this.applyFilters(qb, query);
    const { page, limit } = this.applySortAndPagination(qb, query);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  // ─── ADMIN: Single Retailer by UID ───────────────────────────────────

  async findByUid(uid: string): Promise<Retailer | null> {
    return this.baseQuery().where('r.uid = :uid', { uid }).getOne();
  }

  // ─── SALES REP: Single Assigned Retailer by UID ──────────────────────

  async findByUidForSalesRep(
    uid: string,
    salesRepId: string,
  ): Promise<Retailer | null> {
    return this.baseQuery()
      .innerJoin(
        'sales_rep_retailers',
        'sr',
        'sr.retailer_id = r.id AND sr.sales_rep_id = :salesRepId',
        { salesRepId },
      )
      .where('r.uid = :uid', { uid })
      .getOne();
  }

  async upsertRetailer(data: Partial<Retailer>): Promise<Retailer> {
    const existing = await this.repo.findOne({ where: { uid: data.uid } });

    if (existing) {
      Object.assign(existing, data);
      return this.repo.save(existing);
    }

    const created = this.repo.create(data);
    return this.repo.save(created);
  }

  async findByUids(uids: string[]): Promise<Map<string, Retailer>> {
    if (uids.length === 0) return new Map();

    const retailers = await this.repo
      .createQueryBuilder('r')
      .where('r.uid IN (:...uids)', { uids })
      .getMany();

    return new Map(retailers.map((r) => [r.uid, r]));
  }
}