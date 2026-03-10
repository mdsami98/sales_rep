import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { Region } from '../entities/region.entity';

@Injectable()
export class RegionsRepository extends BaseRepository<Region> {
  constructor(dataSource: DataSource) {
    super(Region, dataSource);
  }

  async getAllRegions(): Promise<Region[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async getRegionWithAreas(id: string): Promise<Region | null> {
    return this.repo.findOne({ where: { id }, relations: ['areas'] });
  }
}
