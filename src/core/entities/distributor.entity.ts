import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('distributors')
export class Distributor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  name: string;
}