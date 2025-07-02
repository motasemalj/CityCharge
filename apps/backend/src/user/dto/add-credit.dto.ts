import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class AddCreditDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  reference?: string;
} 