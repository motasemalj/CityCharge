import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  type: 'credit' | 'debit' | 'admin_adjustment';

  @Column()
  description: string;

  @Column({ nullable: true })
  reference?: string; // For payment references, session IDs, etc.

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balanceAfter: number;

  @CreateDateColumn()
  createdAt: Date;
} 