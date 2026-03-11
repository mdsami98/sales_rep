import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AssignmentRepository } from 'src/core/repositories/assignment.repository';
import { RedisService } from '../redis/redis.service';
import { User } from 'src/core/entities/user.entity';
import { UserRole } from 'src/common/enums/user-role.enum';
import {
  AssignRetailersDto,
  QueryAssignmentsDto,
  UnassignRetailersDto,
} from './dtos/assignment.dto';
import { UsersRepository } from 'src/core/repositories/users.repository';
import { RetailersRepository } from 'src/core/repositories/retailer.repository';

const CACHE_PREFIX = 'assignments';
const LIST_TTL = 30;

@Injectable()
export class AssignmentService {
  constructor(
    private readonly assignmentRepo: AssignmentRepository,
    private readonly redisService: RedisService,
    private readonly userRepo: UsersRepository,
    private readonly retailerRepo: RetailersRepository,
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

  private async validateSalesRep(salesRepId: string): Promise<User> {
    const user = await this.userRepo.findOneByWhere({
      id: salesRepId,
      role: UserRole.SALES_REP,
    });

    if (!user) {
      throw new NotFoundException(
        `Sales Rep with ID "${salesRepId}" not found`,
      );
    }

    return user;
  }

  private async validateRetailers(retailerIds: string[]): Promise<void> {
    const found = await this.retailerRepo.countByIds(retailerIds);

    if (found !== retailerIds.length) {
      const missing = retailerIds.length - found;
      throw new BadRequestException(
        `${missing} retailer(s) not found. Verify all retailer IDs exist.`,
      );
    }
  }

  // ─── LIST ALL ASSIGNMENTS ─────────────────────────────────────────────

  async findAll(query: QueryAssignmentsDto) {
    const cacheKey = `${CACHE_PREFIX}:all:${JSON.stringify(query)}`;

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const { data, total, page, limit } =
          await this.assignmentRepo.findAllAssignments(query);

        return {
          message: 'Assignments fetched successfully',
          data,
          meta: this.buildMeta(total, page, limit),
        };
      },
      LIST_TTL,
    );
  }

  // ─── LIST ASSIGNMENTS FOR A SALES REP ─────────────────────────────────

  async findBySalesRep(salesRepId: string, query: QueryAssignmentsDto) {
    await this.validateSalesRep(salesRepId);

    const cacheKey = `${CACHE_PREFIX}:rep:${salesRepId}:${JSON.stringify(query)}`;

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const { data, total, page, limit } =
          await this.assignmentRepo.findBySalesRep(salesRepId, query);

        return {
          message: `Assignments for sales rep fetched successfully`,
          data,
          meta: this.buildMeta(total, page, limit),
        };
      },
      LIST_TTL,
    );
  }

  // ─── BULK ASSIGN ──────────────────────────────────────────────────────

  async assign(dto: AssignRetailersDto) {
    await this.validateSalesRep(dto.sales_rep_id);
    await this.validateRetailers(dto.retailer_ids);

    const { assigned, skipped } = await this.assignmentRepo.bulkAssign(
      dto.sales_rep_id,
      dto.retailer_ids,
    );

    // Clear caches
    await this.redisService.delPattern(`${CACHE_PREFIX}:*`);
    await this.redisService.delPattern('retailers:*');

    return {
      message: `Bulk assign complete: ${assigned} assigned, ${skipped} skipped (already assigned)`,
      data: {
        sales_rep_id: dto.sales_rep_id,
        requested: dto.retailer_ids.length,
        assigned,
        skipped,
      },
    };
  }

  // ─── BULK UNASSIGN ────────────────────────────────────────────────────

  async unassign(dto: UnassignRetailersDto) {
    await this.validateSalesRep(dto.sales_rep_id);

    const { unassigned, notFound } = await this.assignmentRepo.bulkUnassign(
      dto.sales_rep_id,
      dto.retailer_ids,
    );

    // Clear caches
    await this.redisService.delPattern(`${CACHE_PREFIX}:*`);
    await this.redisService.delPattern('retailers:*');

    return {
      message: `Bulk unassign complete: ${unassigned} removed, ${notFound} were not assigned`,
      data: {
        sales_rep_id: dto.sales_rep_id,
        requested: dto.retailer_ids.length,
        unassigned,
        not_found: notFound,
      },
    };
  }
}