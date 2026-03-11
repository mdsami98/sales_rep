import { Injectable } from '@nestjs/common';
import {
  Repository,
  EntityTarget,
  DataSource,
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  DeepPartial,
  ObjectLiteral,
} from 'typeorm';

@Injectable()
export class BaseRepository<T extends ObjectLiteral> {
  protected readonly repo: Repository<T>;

  constructor(
    private readonly entity: EntityTarget<T>,
    private readonly dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(entity);
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async createMany(data: DeepPartial<T>[]): Promise<T[]> {
    const entities = this.repo.create(data);
    return this.repo.save(entities);
  }

  async saveManyInChunks(
    data: DeepPartial<T>[],
    chunkSize: number = 50,
  ): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const entities = this.repo.create(chunk);
      const saved = await this.repo.save(entities);
      results.push(...saved);
    }

    return results;
  }

  async findById(id: string): Promise<T | null> {
    return this.repo.findOne({
      where: { id } as unknown as FindOptionsWhere<T>,
    });
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repo.find(options);
  }

  async findByWhere(where: FindOptionsWhere<T>): Promise<T[]> {
    return this.repo.findBy(where);
  }

  async findOneByWhere(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repo.findOneBy(where);
  }

  async findWithPagination(
    options: FindManyOptions<T>,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.repo.findAndCount({
      ...options,
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
    await this.repo.update(id, data as any);
    return this.findById(id);
  }

  async save(entity: T): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.repo.save(entity as any);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;  // ✅ fix 2
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repo.softDelete(id);
    return (result.affected ?? 0) > 0;  // ✅ fix 3
  }

  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repo.count({ where });
  }

  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repo.count({ where });
    return count > 0;
  }

  async countByIds(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    return this.repo
      .createQueryBuilder('entity')
      .where('entity.id IN (:...ids)', { ids })
      .getCount();
  }
}