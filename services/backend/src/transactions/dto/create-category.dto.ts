import { IsString, IsOptional, Length, Matches } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color (e.g., #FF5733)' })
  color: string;

  @IsString()
  @Length(1, 50)
  icon: string;

  @IsOptional()
  @IsString()
  description?: string;
}
