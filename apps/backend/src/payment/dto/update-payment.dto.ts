import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdatePaymentDto {
  @IsOptional()
  @IsIn(['pending', 'completed', 'failed'])
  status?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
} 