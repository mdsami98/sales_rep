import { ApiProperty } from '@nestjs/swagger';

export class ImportRetailersDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'CSV file' })
  file: Express.Multer.File;
}

export interface CsvRetailerRow {
  uid: string;
  name: string;
  phone: string;
  region_name: string;
  area_name: string;
  distributor_name: string;
  territory_name: string;
  points?: string;
  routes?: string;
  notes?: string;
}

export interface ImportResult {
  total: number;
  inserted: number;
  updated: number;
  failed: number;
  errors: ImportRowError[];
}

export interface ImportRowError {
  row: number;
  uid: string;
  errors: string[];
}