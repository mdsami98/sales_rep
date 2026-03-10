import { IsOptional, IsString, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryRetailersDto {
  @ApiPropertyOptional({ description: 'Search by name, UID, or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by region ID' })
  @IsOptional()
  @IsUUID()
  region_id?: string;

  @ApiPropertyOptional({ description: 'Filter by area ID' })
  @IsOptional()
  @IsUUID()
  area_id?: string;

  @ApiPropertyOptional({ description: 'Filter by distributor ID' })
  @IsOptional()
  @IsUUID()
  distributor_id?: string;

  @ApiPropertyOptional({ description: 'Filter by territory ID' })
  @IsOptional()
  @IsUUID()
  territory_id?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    default: 'name',
    enum: [
      'name',
      'uid',
      'phone',
      'points',
      'created_at',
      'region',
      'area',
      'territory',
      'distributor',
    ],
  })
  @IsOptional()
  @IsString()
  sort_by?: string;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['ASC', 'DESC'],
    default: 'ASC',
  })
  @IsOptional()
  @IsString()
  sort_order?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class UpdateRetailerDto {
  @ApiPropertyOptional({ description: 'Update retailer points' })
  @IsOptional()
  @IsInt()
  @Min(0)
  points?: number;

  @ApiPropertyOptional({ description: 'Update retailer routes' })
  @IsOptional()
  @IsString()
  routes?: string;

  @ApiPropertyOptional({ description: 'Update retailer notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
