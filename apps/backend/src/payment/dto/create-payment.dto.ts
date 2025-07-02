import { IsString, IsNumber, IsIn, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  amount: number;

  @IsIn(['wallet_topup', 'session_payment'])
  type: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
} 