import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Charger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vendor: string;

  @Column({ nullable: true })
  model: string;

  @Column('float')
  lat: number;

  @Column('float')
  lng: number;

  @Column()
  address: string;

  @Column('simple-array')
  connectorTypes: string[];

  @Column('float')
  powerKW: number;

  @Column({ default: 'available' })
  status: 'available' | 'charging' | 'out_of_service';

  @Column('float')
  pricePerKwh: number;

  @Column('float', { default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;
} 