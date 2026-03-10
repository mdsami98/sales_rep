import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateSalesRepRetailersTable1709900007000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sales_rep_retailers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'sales_rep_id',
            type: 'uuid',
          },
          {
            name: 'retailer_id',
            type: 'uuid',
          },
          {
            name: 'assigned_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign keys
    await queryRunner.createForeignKeys('sales_rep_retailers', [
      new TableForeignKey({
        name: 'FK_sr_retailers_sales_rep_id',
        columnNames: ['sales_rep_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'FK_sr_retailers_retailer_id',
        columnNames: ['retailer_id'],
        referencedTableName: 'retailers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);

    // Indexes
    await queryRunner.createIndices('sales_rep_retailers', [
      new TableIndex({
        name: 'IDX_sr_retailers_sales_rep_id',
        columnNames: ['sales_rep_id'],
      }),
      new TableIndex({
        name: 'IDX_sr_retailers_retailer_id',
        columnNames: ['retailer_id'],
      }),
      new TableIndex({
        name: 'UQ_sales_rep_retailer',
        columnNames: ['sales_rep_id', 'retailer_id'],
        isUnique: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sales_rep_retailers', true);
  }
}