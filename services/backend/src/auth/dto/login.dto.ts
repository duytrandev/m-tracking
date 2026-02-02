import { IsOptional, IsString, IsBoolean, MinLength } from 'class-validator'

export class LoginDto {
  @IsString({ message: 'Email or username is required' })
  @MinLength(1, { message: 'Email or username is required' })
  identifier!: string // Can be email or username

  @IsString()
  password!: string

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean
}
