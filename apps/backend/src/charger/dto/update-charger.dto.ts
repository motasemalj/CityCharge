import { IsString, IsNumber, IsArray, IsIn, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class UpdateChargerDto {
  @IsOptional()
  @IsString()
  chargePointId?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  catalogNumber?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  connectorTypes?: string[];

  @IsOptional()
  @IsNumber()
  powerKW?: number;

  @IsOptional()
  @IsNumber()
  ratedVolts?: number;

  @IsOptional()
  @IsNumber()
  ratedAmps?: number;

  @IsOptional()
  @IsNumber()
  maximumAmps?: number;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  targetGroup?: string;

  @IsOptional()
  @IsIn(['available', 'charging', 'out_of_service'])
  status?: string;

  @IsOptional()
  @IsNumber()
  pricePerKwh?: number;

  @IsOptional()
  @IsBoolean()
  isConnected?: boolean;

  @IsOptional()
  @IsDateString()
  lastSeen?: string;

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsNumber()
  reviewCount?: number;
} 