import { IsString, Length, IsOptional } from 'class-validator'

export class OAuthExchangeDto {
  @IsString()
  @Length(32, 64)
  code!: string

  /**
   * PKCE code_verifier (RFC 7636)
   * Optional: only required if frontend initiated PKCE flow
   */
  @IsString()
  @IsOptional()
  @Length(43, 128)
  codeVerifier?: string

  /**
   * OAuth state parameter
   * Required when codeVerifier is provided for PKCE verification
   */
  @IsString()
  @IsOptional()
  @Length(16, 64)
  state?: string
}
