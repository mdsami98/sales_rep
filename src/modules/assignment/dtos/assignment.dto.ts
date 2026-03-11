import { IsUUID, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRetailersDto {
  @ApiProperty({ description: 'Sales Rep user ID' })
  @IsUUID()
  sales_rep_id: string;

  @ApiProperty({
    description: 'Array of retailer IDs to assign',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsUUID('4', { each: true })
  retailer_ids: string[];
}

export class UnassignRetailersDto {
  @ApiProperty({ description: 'Sales Rep user ID' })
  @IsUUID()
  sales_rep_id: string;

  @ApiProperty({
    description: 'Array of retailer IDs to unassign',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsUUID('4', { each: true })
  retailer_ids: string[];
}

import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAssignmentsDto {
  @ApiPropertyOptional({
    description: 'Search by retailer name, UID, or SR name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    default: 'assigned_at',
    enum: ['assigned_at', 'retailer_name', 'sales_rep_name'],
  })
  @IsOptional()
  @IsString()
  sort_by?: string;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsString()
  sort_order?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}