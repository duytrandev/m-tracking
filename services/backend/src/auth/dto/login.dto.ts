import { IsEmail, IsOptional, IsString, IsBoolean } from 'class-validator'

export class LoginDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string

  @IsString()
  password!: string

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean
}
