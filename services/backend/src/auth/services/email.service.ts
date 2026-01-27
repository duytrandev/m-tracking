import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private resend: Resend
  private readonly fromEmail: string
  private readonly frontendUrl: string

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY')

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY not configured. Email service will not work.'
      )
    }

    this.resend = new Resend(apiKey)
    this.fromEmail = this.configService.get<string>(
      'EMAIL_FROM',
      'M-Tracking <noreply@m-tracking.com>'
    )
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000'
    )
  }

  /**
   * Send email verification email
   * @param email User email address
   * @param token Verification token
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Verify your email address',
        html: this.getVerificationEmailTemplate(verificationUrl),
      })

      this.logger.log(`Verification email sent to ${email}`)
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error)
      throw new Error('Failed to send verification email')
    }
  }

  /**
   * Send password reset email
   * @param email User email address
   * @param token Reset token
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Reset your password',
        html: this.getPasswordResetEmailTemplate(resetUrl),
      })

      this.logger.log(`Password reset email sent to ${email}`)
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error
      )
      throw new Error('Failed to send password reset email')
    }
  }

  /**
   * Generate verification email HTML template
   * @param url Verification URL
   * @returns HTML template
   */
  private getVerificationEmailTemplate(url: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>M-Tracking</h1>
  </div>
  <div class="content">
    <h2>Verify Your Email Address</h2>
    <p>Thank you for registering with M-Tracking! Please verify your email address to complete your registration.</p>
    <p>Click the button below to verify your email:</p>
    <p style="text-align: center;">
      <a href="${url}" class="button">Verify Email</a>
    </p>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; font-size: 12px; color: #6b7280;">${url}</p>
    <p style="margin-top: 30px; color: #ef4444;"><strong>This link expires in 24 hours.</strong></p>
    <p>If you didn't create an account with M-Tracking, you can safely ignore this email.</p>
  </div>
  <div class="footer">
    <p>&copy; 2026 M-Tracking. All rights reserved.</p>
  </div>
</body>
</html>
    `
  }

  /**
   * Generate password reset email HTML template
   * @param url Reset URL
   * @returns HTML template
   */
  private getPasswordResetEmailTemplate(url: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>M-Tracking</h1>
  </div>
  <div class="content">
    <h2>Reset Your Password</h2>
    <p>We received a request to reset your password for your M-Tracking account.</p>
    <p>Click the button below to reset your password:</p>
    <p style="text-align: center;">
      <a href="${url}" class="button">Reset Password</a>
    </p>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; font-size: 12px; color: #6b7280;">${url}</p>
    <p style="margin-top: 30px; color: #ef4444;"><strong>This link expires in 1 hour.</strong></p>
    <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
  </div>
  <div class="footer">
    <p>&copy; 2026 M-Tracking. All rights reserved.</p>
  </div>
</body>
</html>
    `
  }
}
