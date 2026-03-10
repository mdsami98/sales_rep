import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { Distributor } from 'src/core/entities/distributor.entity';

@Injectable()
export class DistributorsRepository extends BaseRepository<Distributor> {
  protected readonly tableName = 'distributors';

  constructor(dataSource: DataSource) {
    super(Distributor, dataSource);
  }

  async getAllDistributors(): Promise<Distributor[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }
}