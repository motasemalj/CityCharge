import { IsString, IsDateString, IsOptional, IsNumber, IsIn } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  chargerId: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  kwhConsumed?: number;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsIn(['active', 'completed', 'error'])
  status: string;
} 