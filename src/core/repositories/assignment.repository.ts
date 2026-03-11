import { Injectable } from '@nestjs/common';
import { DataSource, In, SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { SalesRepRetailer } from 'src/core/entities/sales-rep-retailer.entity';
import { QueryAssignmentsDto } from 'src/modules/assignment/dtos/assignment.dto';

@Injectable()
export class AssignmentRepository extends BaseRepository<SalesRepRetailer> {
  constructor(dataSource: DataSource) {
    super(SalesRepRetailer, dataSource);
  }

  // ─── Base Query ───────────────────────────────────────────────────────

  private baseQuery(): SelectQueryBuilder<SalesRepRetailer> {
    return this.repo
      .createQueryBuilder('sr')
      .leftJoin('sr.salesRep', 'user')
      .leftJoin('sr.retailer', 'retailer')
      .leftJoin('retailer.region', 'region')
      .leftJoin('retailer.area', 'area')
      .leftJoin('retailer.distributor', 'distributor')
      .leftJoin('retailer.territory', 'territory')
      .addSelect(['user.id', 'user.first_name', 'user.last_name', 'user.email'])
      .addSelect([
        'retailer.id',
        'retailer.uid',
        'retailer.name',
        'retailer.phone',
        'retailer.points',
        'retailer.routes',
      ])
      .addSelect(['region.id', 'region.name'])
      .addSelect(['area.id', 'area.name'])
      .addSelect(['distributor.id', 'distributor.name'])
      .addSelect(['territory.id', 'territory.name']);
  }

  // ─── Apply Search ─────────────────────────────────────────────────────

  private applySearch(
    qb: SelectQueryBuilder<SalesRepRetailer>,
    search?: string,
  ): SelectQueryBuilder<SalesRepRetailer> {
    if (search) {
      const s = `%${search.trim()}%`;
      qb.andWhere(
        `(retailer.name ILIKE :s OR retailer.uid ILIKE :s OR user.first_name ILIKE :s OR user.last_name ILIKE :s)`,
        { s },
      );
    }
    return qb;
  }

  // ─── Apply Sort & Pagination ──────────────────────────────────────────

  private applySortAndPagination(
    qb: SelectQueryBuilder<SalesRepRetailer>,
    query: QueryAssignmentsDto,
  ): { page: number; limit: number } {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const sortOrder = query.sort_order || 'DESC';

    const querySortBy = query.sort_by || 'assigned_at';

    const SORT_MAP: Record<string, string> = {
      assigned_at: 'sr.assigned_at',
      retailer_name: 'retailer.name',
      sales_rep_name: 'user.first_name',
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const sortBy = SORT_MAP[querySortBy] || 'sr.assigned_at';
    qb.orderBy(sortBy, sortOrder);
    qb.skip((page - 1) * limit).take(limit);

    return { page, limit };
  }

  // ─── List All Assignments (Paginated) ─────────────────────────────────

  async findAllAssignments(query: QueryAssignmentsDto): Promise<{
    data: SalesRepRetailer[];
    total: number;
    page: number;
    limit: number;
  }> {
    const qb = this.baseQuery();
    this.applySearch(qb, query.search);
    const { page, limit } = this.applySortAndPagination(qb, query);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  // ─── List Assignments for a Sales Rep (Paginated) ─────────────────────

  async findBySalesRep(
    salesRepId: string,
    query: QueryAssignmentsDto,
  ): Promise<{
    data: SalesRepRetailer[];
    total: number;
    page: number;
    limit: number;
  }> {
    const qb = this.baseQuery();
    qb.where('sr.sales_rep_id = :salesRepId', { salesRepId });
    this.applySearch(qb, query.search);
    const { page, limit } = this.applySortAndPagination(qb, query);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  // ─── Find Existing Assignments ────────────────────────────────────────

  async findExisting(
    salesRepId: string,
    retailerIds: string[],
  ): Promise<SalesRepRetailer[]> {
    if (retailerIds.length === 0) return [];

    return this.repo.find({
      where: {
        sales_rep_id: salesRepId,
        retailer_id: In(retailerIds),
      },
    });
  }

  // ─── Bulk Assign ──────────────────────────────────────────────────────

  async bulkAssign(
    salesRepId: string,
    retailerIds: string[],
  ): Promise<{ assigned: number; skipped: number }> {
    // Find already assigned
    const existing = await this.findExisting(salesRepId, retailerIds);
    const existingSet = new Set(existing.map((e) => e.retailer_id));

    const toAssign = retailerIds.filter((id) => !existingSet.has(id));
    const skipped = retailerIds.length - toAssign.length;

    if (toAssign.length > 0) {
      const entities = toAssign.map((retailer_id) =>
        this.repo.create({
          sales_rep_id: salesRepId,
          retailer_id,
        }),
      );
      await this.repo.save(entities);
    }

    return { assigned: toAssign.length, skipped };
  }

  // ─── Bulk Unassign ────────────────────────────────────────────────────

  async bulkUnassign(
    salesRepId: string,
    retailerIds: string[],
  ): Promise<{ unassigned: number; notFound: number }> {
    const existing = await this.findExisting(salesRepId, retailerIds);
    const existingIds = existing.map((e) => e.id);
    const notFound = retailerIds.length - existingIds.length;

    if (existingIds.length > 0) {
      await this.repo.delete(existingIds);
    }

    return { unassigned: existingIds.length, notFound };
  }
}