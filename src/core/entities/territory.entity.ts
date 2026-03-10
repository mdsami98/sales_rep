import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Area } from './area.entity';

@Entity('territories')
export class Territory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'uuid' })
  area_id: string;

  @ManyToOne(() => Area, (area) => area.territories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'area_id' })
  area: Area;
}