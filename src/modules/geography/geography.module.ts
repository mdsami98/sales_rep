
import { Module } from '@nestjs/common';
import { GeographyController } from './geography.controller';
import { GeographyService } from './geography.service';
import { RegionsRepository } from 'src/core/repositories/regions.repository';
import { RedisService } from '../redis/redis.service';
import { AreasRepository } from 'src/core/repositories/area.repository';
import { DistributorsRepository } from 'src/core/repositories/distributors.repository';
import { TerritoriesRepository } from 'src/core/repositories/territories.repository';

@Module({
  controllers: [GeographyController],
  providers: [
    GeographyService,
    RegionsRepository,
    AreasRepository,
    DistributorsRepository,
    TerritoriesRepository,
    RedisService,
  ],
  exports: [GeographyService],
})
export class GeographyModule {}
