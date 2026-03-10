import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { Area } from 'src/core/entities/area.entity';

@Injectable()
export class AreasRepository extends BaseRepository<Area> {
  protected readonly tableName = 'areas';

  constructor(dataSource: DataSource) {
    super(Area, dataSource);
  }

  async getAllAreas(regionId?: string): Promise<Area[]> {
    const qb = this.repo
      .createQueryBuilder('area')
      .leftJoinAndSelect('area.region', 'region')
      .orderBy('area.name', 'ASC');

    if (regionId) {
      qb.where('area.region_id = :regionId', { regionId });
    }

    return qb.getMany();
  }

  async getAreaWithRelations(id: string): Promise<Area | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['region', 'territories'],
    });
  }
}