import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { Region } from './region.entity';
import { Area } from './area.entity';
import { Distributor } from './distributor.entity';
import { Territory } from './territory.entity';
import { SalesRepRetailer } from './sales-rep-retailer.entity';

@Index('IDX_retailers_region_id', ['region_id'])
@Index('IDX_retailers_area_id', ['area_id'])
@Index('IDX_retailers_distributor_id', ['distributor_id'])
@Index('IDX_retailers_territory_id', ['territory_id'])
@Entity('retailers')
export class Retailer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  uid: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  phone: string;

  @Column({ type: 'uuid' })
  region_id: string;

  @Column({ type: 'uuid' })
  area_id: string;

  @Column({ type: 'uuid' })
  distributor_id: string;

  @Column({ type: 'uuid' })
  territory_id: string;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'text', nullable: true })
  routes: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => Region, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'region_id' })
  region: Region;

  @ManyToOne(() => Area, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'area_id' })
  area: Area;

  @ManyToOne(() => Distributor, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'distributor_id' })
  distributor: Distributor;

  @ManyToOne(() => Territory, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'territory_id' })
  territory: Territory;

  @OneToMany(() => SalesRepRetailer, (sr) => sr.retailer)
  salesRepRetailers: SalesRepRetailer[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}