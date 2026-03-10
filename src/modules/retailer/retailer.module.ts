import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Retailer } from 'src/core/entities/retailer.entity';
import { RetailersController } from './retailer.controller';
import { RetailersService } from './retailer.service';
import { RetailersRepository } from 'src/core/repositories/retailer.repository';
import { RedisService } from '../redis/redis.service';
import { RegionsRepository } from 'src/core/repositories/regions.repository';
import { AreasRepository } from 'src/core/repositories/area.repository';
import { TerritoriesRepository } from 'src/core/repositories/territories.repository';
import { DistributorsRepository } from 'src/core/repositories/distributors.repository';

@Module({
  imports: [],
  controllers: [RetailersController],
  providers: [
    RetailersService,
    RetailersRepository,
    RegionsRepository,
    AreasRepository,
    TerritoriesRepository,
    DistributorsRepository,
    RedisService,
  ],
  exports: [RetailersService, RetailersRepository],
})
export class RetailersModule {}
