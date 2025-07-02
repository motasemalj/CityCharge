import { IsString, IsNumber, IsArray, IsIn } from 'class-validator';

export class CreateChargerDto {
  @IsString()
  vendor: string;

  @IsString()
  model: string;

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

  @IsIn(['available', 'charging', 'out_of_service'])
  status: string;

  @IsNumber()
  pricePerKwh: number;
} 