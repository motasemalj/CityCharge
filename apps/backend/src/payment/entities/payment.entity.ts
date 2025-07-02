import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column('float')
  amount: number;

  @Column()
  type: 'wallet_topup' | 'session_payment';

  @Column({ default: 'pending' })
  status: 'pending' | 'completed' | 'failed';

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  sessionId?: string;
} 