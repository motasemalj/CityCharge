import { IsString, IsOptional, IsNumber, IsIn, IsDateString } from 'class-validator';

export class UpdateSessionDto {
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  kwhConsumed?: number;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsIn(['active', 'completed', 'error'])
  status?: string;
} 