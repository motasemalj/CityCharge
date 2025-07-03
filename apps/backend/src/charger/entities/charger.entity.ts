import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Charger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // OCPP-specific identifier (e.g., "JAAL34S021")
  @Column({ unique: true })
  chargePointId: string;

  // Hardware information
  @Column({ nullable: true })
  serialNumber: string;

  @Column({ nullable: true })
  catalogNumber: string;

  @Column()
  vendor: string;

  @Column({ nullable: true })
  model: string;

  // Location information
  @Column('float')
  lat: number;

  @Column('float')
  lng: number;

  @Column()
  address: string;

  // Technical specifications
  @Column('simple-array')
  connectorTypes: string[];

  @Column('float')
  powerKW: number;

  @Column('float', { nullable: true })
  ratedVolts: number;

  @Column('float', { nullable: true })
  ratedAmps: number;

  @Column('float', { nullable: true })
  maximumAmps: number;

  // Network information (optional, for management purposes)
  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  targetGroup: string;

  // Status and pricing
  @Column({ default: 'available' })
  status: 'available' | 'charging' | 'out_of_service';

  @Column('float')
  pricePerKwh: number;

  // OCPP connection status
  @Column({ default: false })
  isConnected: boolean;

  @Column({ nullable: true })
  lastSeen: Date;

  // Rating information
  @Column('float', { default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;
} 