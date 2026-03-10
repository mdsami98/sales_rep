import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  token: string; // The refresh token (hashed for security)

  @Column({ type: 'timestamp' })
  expires_at: Date; // Expiration time of the refresh token

  @Column({ type: 'timestamp', nullable: true })
  revoked_at: Date | null; // When the token was revoked (nullable)

  @Column({ type: 'varchar', length: 255, nullable: true })
  ip_address: string | null; // IP address of the device using the token

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_agent: string | null; // Device/browser info (optional)

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.refreshTokens)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  user_id: string; // Foreign key referencing `users.id`
}
