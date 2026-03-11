import { Module } from '@nestjs/common';
import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';
import { AssignmentRepository } from 'src/core/repositories/assignment.repository';
import { RedisService } from '../redis/redis.service';
import { UsersRepository } from 'src/core/repositories/users.repository';
import { RetailersRepository } from 'src/core/repositories/retailer.repository';

@Module({
  imports: [],
  controllers: [AssignmentController],
  providers: [
    AssignmentService,
    UsersRepository,
    AssignmentRepository,
    RetailersRepository,
    RedisService,
  ],
  exports: [AssignmentService, AssignmentRepository],
})
export class AssignmentModule {}
