import { BadRequestException } from '@nestjs/common';
import { Readable } from 'stream';
import * as csv from 'csv-parser';

export async function parseCsv<T = Record<string, string>>(
  buffer: Buffer,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];

    const stream = Readable.from(buffer);

    stream
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim().toLowerCase(),
          skipLines: 0,
        }),
      )
      .on('data', (row: T) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', (err) =>
        reject(new BadRequestException(`CSV parsing failed: ${err.message}`)),
      );
  });
}
