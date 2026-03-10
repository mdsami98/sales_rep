import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateRetailersTable1709900006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'retailers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'uid',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'phone',
            type: 'varchar',
          },
          {
            name: 'region_id',
            type: 'uuid',
          },
          {
            name: 'area_id',
            type: 'uuid',
          },
          {
            name: 'distributor_id',
            type: 'uuid',
          },
          {
            name: 'territory_id',
            type: 'uuid',
          },
          {
            name: 'points',
            type: 'int',
            default: 0,
          },
          {
            name: 'routes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign keys
    await queryRunner.createForeignKeys('retailers', [
      new TableForeignKey({
        name: 'FK_retailers_region_id',
        columnNames: ['region_id'],
        referencedTableName: 'regions',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        name: 'FK_retailers_area_id',
        columnNames: ['area_id'],
        referencedTableName: 'areas',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        name: 'FK_retailers_distributor_id',
        columnNames: ['distributor_id'],
        referencedTableName: 'distributors',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        name: 'FK_retailers_territory_id',
        columnNames: ['territory_id'],
        referencedTableName: 'territories',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);

    // Indexes for filtering
    await queryRunner.createIndices('retailers', [
      new TableIndex({
        name: 'IDX_retailers_region_id',
        columnNames: ['region_id'],
      }),
      new TableIndex({
        name: 'IDX_retailers_area_id',
        columnNames: ['area_id'],
      }),
      new TableIndex({
        name: 'IDX_retailers_distributor_id',
        columnNames: ['distributor_id'],
      }),
      new TableIndex({
        name: 'IDX_retailers_territory_id',
        columnNames: ['territory_id'],
      }),
      new TableIndex({
        name: 'IDX_retailers_uid',
        columnNames: ['uid'],
      }),
      new TableIndex({
        name: 'IDX_retailers_phone',
        columnNames: ['phone'],
      }),
    ]);

    // Trigram index for fast fuzzy search on name
    await queryRunner.query(
      `CREATE INDEX "IDX_retailers_name_trgm" ON "retailers" USING gin ("name" gin_trgm_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('retailers', true);
  }
}