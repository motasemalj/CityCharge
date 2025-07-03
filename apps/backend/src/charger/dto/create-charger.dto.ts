import { IsString, IsNumber, IsArray, IsIn, IsOptional } from 'class-validator';

export class CreateChargerDto {
  @IsString()
  chargePointId: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  catalogNumber?: string;

  @IsString()
  vendor: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsString()
  address: string;

  @IsArray()
  @IsString({ each: true })
  connectorTypes: string[];

  @IsNumber()
  powerKW: number;

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

  @IsNumber()
  pricePerKwh: number;
} 