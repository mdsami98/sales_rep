import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.DATABASE_HOST'),
        port: config.get<number>('database.DATABASE_PORT'),
        username: config.get<string>('database.DATABASE_USER'),
        password: config.get<string>('database.DATABASE_PASSWORD'),
        database: config.get<string>('database.DATABASE_NAME'),
        synchronize: false,
        entities: [__dirname + '/../core/entities/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: false, // Set true to auto-run on app start
      }),
    }),
  ],
})
export class DatabaseModule { }