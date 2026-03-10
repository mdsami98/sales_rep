import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { Territory } from 'src/core/entities/territory.entity';

@Injectable()
export class TerritoriesRepository extends BaseRepository<Territory> {
  protected readonly tableName = 'territories';

  constructor(dataSource: DataSource) {
    super(Territory, dataSource);
  }

  async getAllTerritories(areaId?: string): Promise<Territory[]> {
    const qb = this.repo
      .createQueryBuilder('territory')
      .leftJoinAndSelect('territory.area', 'area')
      .leftJoin('area.region', 'region')
      .addSelect(['region.id', 'region.name'])
      .orderBy('territory.name', 'ASC');

    if (areaId) {
      qb.where('territory.area_id = :areaId', { areaId });
    }

    return qb.getMany();
  }

  async getTerritoryWithRelations(id: string): Promise<Territory | null> {
    return this.repo
      .createQueryBuilder('territory')
      .leftJoinAndSelect('territory.area', 'area')
      .leftJoin('area.region', 'region')
      .addSelect(['region.id', 'region.name'])
      .where('territory.id = :id', { id })
      .getOne();
  }
}