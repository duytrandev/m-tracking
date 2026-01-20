import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, Length, Min } from 'class-validator';
import { TransactionType } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @IsString()
  @Length(1, 36)
  categoryId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  @Length(1, 255)
  description: string;

  @IsDateString()
  date: string;

  @IsString()
  @Length(3, 3)
  currency: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
