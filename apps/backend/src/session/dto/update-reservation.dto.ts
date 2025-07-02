import { IsString, IsOptional, IsIn, IsDateString } from 'class-validator';

export class UpdateReservationDto {
  @IsOptional()
  @IsIn(['active', 'cancelled', 'completed'])
  status?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;
} 