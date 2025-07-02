import { IsString, IsNumber, IsArray, IsIn, IsOptional } from 'class-validator';

export class UpdateChargerDto {
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
  @IsIn(['available', 'charging', 'out_of_service'])
  status?: string;

  @IsOptional()
  @IsNumber()
  pricePerKwh?: number;

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsNumber()
  reviewCount?: number;
} 