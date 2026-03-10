import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import { SalesRepRetailer } from './sales-rep-retailer.entity';
import { UserRole } from 'src/common/enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  first_name: string;

  @Column({ type: 'varchar', nullable: false })
  last_name: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', select: false })
  password_hash: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  mfa_enabled: boolean;

  @Column({ type: 'smallint', default: UserRole.SALES_REP })
  role: UserRole;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  @JoinColumn({ name: 'id' })
  refreshTokens: RefreshToken[];

  @OneToMany(() => SalesRepRetailer, (sr) => sr.salesRep)
  salesRepRetailers: SalesRepRetailer[];
}