import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class ChargingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  chargerId: string;

  @Column('timestamptz')
  startTime: Date;

  @Column('timestamptz', { nullable: true })
  endTime?: Date;

  @Column('float', { nullable: true })
  kwhConsumed?: number;

  @Column('float', { nullable: true })
  cost?: number;

  @Column({ default: 'active' })
  status: 'active' | 'completed' | 'error';
} 