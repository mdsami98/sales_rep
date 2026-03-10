import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsOptional,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

// ─── Region ───────────────────────────────────────────────────────────────────

export class CreateRegionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class UpdateRegionDto extends PartialType(CreateRegionDto) {}

// ─── Area ─────────────────────────────────────────────────────────────────────

export class CreateAreaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNotEmpty()
  @IsUUID()
  region_id: string;
}

export class UpdateAreaDto extends PartialType(CreateAreaDto) {}

// ─── Distributor ──────────────────────────────────────────────────────────────

export class CreateDistributorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateDistributorDto extends PartialType(CreateDistributorDto) {}

// ─── Territory ────────────────────────────────────────────────────────────────

export class CreateTerritoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNotEmpty()
  @IsUUID()
  area_id: string;
}

export class UpdateTerritoryDto extends PartialType(CreateTerritoryDto) {}

// ─── Query ────────────────────────────────────────────────────────────────────

export class QueryAreasDto {
  @IsOptional()
  @IsUUID()
  region_id?: string;
}

export class QueryTerritoriesDto {
  @IsOptional()
  @IsUUID()
  area_id?: string;
}