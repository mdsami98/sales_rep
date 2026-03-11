import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// ─── Region ───────────────────────────────────────────────────────────────────

export class CreateRegionDto {
  @ApiProperty({
    description: 'Region name',
    example: 'Dhaka',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}

export class UpdateRegionDto extends PartialType(CreateRegionDto) {}

// ─── Area ─────────────────────────────────────────────────────────────────────

export class CreateAreaDto {
  @ApiProperty({
    description: 'Area name',
    example: 'Gulshan',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Parent region UUID',
    example: 'a1b2c3d4-0000-0000-0000-000000000001',
  })
  @IsNotEmpty()
  @IsUUID()
  region_id: string;
}

export class UpdateAreaDto extends PartialType(CreateAreaDto) {}

// ─── Distributor ──────────────────────────────────────────────────────────────

export class CreateDistributorDto {
  @ApiProperty({
    description: 'Distributor name',
    example: 'AB Trading',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '01712345678',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Physical address',
    example: '123 Main St, Dhaka',
  })
  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateDistributorDto extends PartialType(CreateDistributorDto) {}

// ─── Territory ────────────────────────────────────────────────────────────────

export class CreateTerritoryDto {
  @ApiProperty({
    description: 'Territory name',
    example: 'Gulshan - Zone 1',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Parent area UUID',
    example: 'a1b2c3d4-0000-0000-0000-000000000002',
  })
  @IsNotEmpty()
  @IsUUID()
  area_id: string;
}

export class UpdateTerritoryDto extends PartialType(CreateTerritoryDto) {}

// ─── Query DTOs ───────────────────────────────────────────────────────────────

export class QueryAreasDto {
  @ApiPropertyOptional({
    description: 'Filter areas by region UUID',
    example: 'a1b2c3d4-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID()
  region_id?: string;
}

export class QueryTerritoriesDto {
  @ApiPropertyOptional({
    description: 'Filter territories by area UUID',
    example: 'a1b2c3d4-0000-0000-0000-000000000002',
  })
  @IsOptional()
  @IsUUID()
  area_id?: string;
}