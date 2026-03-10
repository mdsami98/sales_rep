import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Retailer } from './retailer.entity';

@Unique('UQ_sales_rep_retailer', ['sales_rep_id', 'retailer_id'])
@Index('IDX_sr_retailers_sales_rep_id', ['sales_rep_id'])
@Index('IDX_sr_retailers_retailer_id', ['retailer_id'])
@Entity('sales_rep_retailers')
export class SalesRepRetailer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sales_rep_id: string;

  @Column({ type: 'uuid' })
  retailer_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sales_rep_id' })
  salesRep: User;

  @ManyToOne(() => Retailer, (retailer) => retailer.salesRepRetailers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'retailer_id' })
  retailer: Retailer;

  @CreateDateColumn({ type: 'timestamp' })
  assigned_at: Date;
}