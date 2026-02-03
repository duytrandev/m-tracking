import { IsEnum, IsOptional, IsDateString, IsString } from 'class-validator'

export enum TimePeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  CUSTOM = 'custom',
}

export class SpendingQueryDto {
  @IsEnum(TimePeriod)
  period!: TimePeriod

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string

  @IsOptional()
  @IsString()
  timezone?: string // IANA timezone e.g., 'Asia/Saigon', defaults to UTC
}
