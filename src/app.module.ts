import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from 'src/config/database.config';
import appConfig from 'src/config/app.config';
import jwtConfig from 'src/config/jwt.config';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './common/guard/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './common/guard/roles.guard';
import { GeographyModule } from './modules/geography/geography.module';
import redisConfig from './config/redis.config';
import { RedisCacheModule } from './modules/redis/redis.module';
import { RetailersModule } from './modules/retailer/retailer.module';
import { AssignmentModule } from './modules/assignment/assignment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig, jwtConfig, redisConfig],
    }),
    DatabaseModule,
    RedisCacheModule,
    AuthModule,
    GeographyModule,
    UsersModule,
    RetailersModule,
    AssignmentModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
