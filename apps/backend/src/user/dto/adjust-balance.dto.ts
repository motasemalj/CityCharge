import { IsNumber, IsString, Min } from 'class-validator';

export class AdjustBalanceDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  description: string;
} 