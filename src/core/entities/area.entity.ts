import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Region } from './region.entity';
import { Territory } from './territory.entity';

@Entity('areas')
export class Area {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'uuid' })
  region_id: string;

  @ManyToOne(() => Region, (region) => region.areas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'region_id' })
  region: Region;

  @OneToMany(() => Territory, (territory) => territory.area)
  territories: Territory[];
}