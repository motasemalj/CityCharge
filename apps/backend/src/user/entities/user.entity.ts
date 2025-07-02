import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { Wallet } from './wallet.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @Column({ default: 'user' })
  role: 'user' | 'admin';

  @OneToOne(() => Wallet, wallet => wallet.user)
  wallet: Wallet;

  @Column({ default: true })
  isActive: boolean;
} 