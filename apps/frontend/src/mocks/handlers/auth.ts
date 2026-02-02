/**
 * Authentication API Mock Handlers
 *
 * This module provides comprehensive mock handlers for all authentication-related API endpoints.
 * Handlers are organized by functionality and include proper request matching, error scenarios,
 * and realistic response data.
 */

import { http, HttpResponse } from 'msw'
import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  MagicLinkRequest,
  OTPRequest,
} from '@/types/api/auth'
import type { User } from '@/types/entities'

// API base URL configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// Mock user data for authentication - using type assertions to avoid type conflicts
const mockUsers = new Map<string, { password: string; user: User }>([
  [
    'test@example.com',
    {
      password: 'password123',
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        timezone: 'America/New_York',
        currency: 'USD',
        emailVerified: false,
        twoFactorEnabled: false,
        roles: ['USER'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as User,
    },
  ],
  [
    'demo@example.com',
    {
      password: 'demo123',
      user: {
        id: 'user-456',
        email: 'demo@example.com',
        name: 'Demo User',
        timezone: 'America/New_York',
        currency: 'USD',
        emailVerified: true,
        twoFactorEnabled: false,
        roles: ['USER'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as User,
    },
  ],
])

/**
 * Generate mock authentication tokens
 */
const generateTokens = () => ({
  accessToken: `mock-access-token-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  refreshToken: `mock-refresh-token-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  expiresIn: 3600, // 1 hour
})

/**
 * Simulate network delay for realistic testing
 */
const delay = (ms: number = 300) =>
  new Promise(resolve => setTimeout(resolve, ms))

/**
 * Validate request body and return error response if invalid
 */
const validateRequestBody = async <T>(request: Request): Promise<T | null> => {
  try {
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return null
    }
    return (await request.json()) as T
  } catch {
    return null
  }
}

/**
 * Safely parse request body without strict typing
 */
const parseRequestBody = async (
  request: Request
): Promise<Record<string, unknown> | null> => {
  try {
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return null
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await request.json()
  } catch {
    return null
  }
}

export const authHandlers = [
  // ==================== LOGIN ENDPOINTS ====================

  /**
   * POST /auth/login
   * Authenticates user with email and password
   *
   * Success: Returns access token, refresh token, and user data
   * Error Cases: Invalid credentials, account locked, server error
   */
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    await delay(400) // Simulate network latency

    const body = await validateRequestBody<LoginRequest>(request)

    if (!body) {
      return HttpResponse.json(
        { message: 'Invalid request body', statusCode: 400 },
        { status: 400 }
      )
    }

    // Simulate validation errors
    if (!body.email || !body.password) {
      return HttpResponse.json(
        {
          message: 'Email and password are required',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Check credentials
    const userRecord = mockUsers.get(body.email)

    if (!userRecord || userRecord.password !== body.password) {
      // Simulate rate limiting after failed attempts
      const attempts = parseInt(
        request.headers.get('x-auth-attempts') || '0',
        10
      )
      if (attempts >= 3) {
        return HttpResponse.json(
          {
            message:
              'Account temporarily locked due to too many failed attempts',
            statusCode: 429,
            error: 'ACCOUNT_LOCKED',
          },
          { status: 429 }
        )
      }

      return HttpResponse.json(
        {
          message: 'Invalid email or password',
          statusCode: 401,
          error: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      )
    }

    // Successful login
    const tokens = generateTokens()
    return HttpResponse.json({
      ...tokens,
      user: userRecord.user,
    })
  }),

  /**
   * POST /auth/logout
   * Logs out the current user
   *
   * Success: Returns success message
   * Error Cases: Invalid token, server error
   */
  http.post(`${API_URL}/auth/logout`, async () => {
    await delay(200)

    // In a real implementation, this would invalidate the refresh token
    return HttpResponse.json({
      message: 'Logged out successfully',
    })
  }),

  /**
   * POST /auth/refresh
   * Refreshes the access token using the refresh token
   *
   * Success: Returns new access token and refresh token
   * Error Cases: Invalid refresh token, expired refresh token
   */
  http.post(`${API_URL}/auth/refresh`, async ({ request }) => {
    await delay(300)

    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          message: 'Invalid refresh token',
          statusCode: 401,
          error: 'INVALID_TOKEN',
        },
        { status: 401 }
      )
    }

    const tokens = generateTokens()
    return HttpResponse.json(tokens)
  }),

  // ==================== REGISTRATION ENDPOINTS ====================

  /**
   * POST /auth/register
   * Registers a new user account
   *
   * Success: Returns user data and success message
   * Error Cases: Email already exists, validation errors, server error
   */
  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    await delay(500)

    const body = await validateRequestBody<RegisterRequest>(request)

    if (!body) {
      return HttpResponse.json(
        { message: 'Invalid request body', statusCode: 400 },
        { status: 400 }
      )
    }

    // Validation errors
    if (!body.email || !body.password || !body.name) {
      return HttpResponse.json(
        {
          message: 'Email, password, and name are required',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    if (body.password.length < 8) {
      return HttpResponse.json(
        {
          message: 'Password must be at least 8 characters long',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Check if email already exists
    if (mockUsers.has(body.email)) {
      return HttpResponse.json(
        {
          message: 'An account with this email already exists',
          statusCode: 409,
          error: 'EMAIL_EXISTS',
        },
        { status: 409 }
      )
    }

    // Create new user
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: body.email,
      name: body.name,
      timezone: 'America/New_York',
      currency: 'USD',
      emailVerified: false,
      twoFactorEnabled: false,
      roles: ['USER'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as User

    mockUsers.set(body.email, { password: body.password, user: newUser })

    const tokens = generateTokens()
    return HttpResponse.json(
      {
        user: newUser,
        message:
          'Registration successful. Please check your email to verify your account.',
        ...tokens,
      },
      { status: 201 }
    )
  }),

  // ==================== EMAIL VERIFICATION ENDPOINTS ====================

  /**
   * POST /auth/verify-email
   * Verifies user email with verification token
   */
  http.post(`${API_URL}/auth/verify-email`, async ({ request }) => {
    await delay(300)

    const body = await validateRequestBody<VerifyEmailRequest>(request)

    if (!body?.token) {
      return HttpResponse.json(
        {
          message: 'Verification token is required',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Simulate invalid token
    if (body.token.length < 10) {
      return HttpResponse.json(
        {
          message: 'Invalid or expired verification token',
          statusCode: 400,
          error: 'INVALID_TOKEN',
        },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      message: 'Email verified successfully',
    })
  }),

  /**
   * POST /auth/resend-verification
   * Resends email verification link
   */
  http.post(`${API_URL}/auth/resend-verification`, async ({ request }) => {
    await delay(300)

    const body = await parseRequestBody(request)
    const email = body?.email as string | undefined

    if (!email) {
      return HttpResponse.json(
        {
          message: 'Email is required',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Simulate email not found
    if (!mockUsers.has(email)) {
      return HttpResponse.json(
        {
          message: 'No account found with this email',
          statusCode: 404,
          error: 'NOT_FOUND',
        },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      message: 'Verification email sent successfully',
    })
  }),

  // ==================== PASSWORD RESET ENDPOINTS ====================

  /**
   * POST /auth/forgot-password
   * Initiates password reset process
   */
  http.post(`${API_URL}/auth/forgot-password`, async ({ request }) => {
    await delay(400)

    const body = await validateRequestBody<ForgotPasswordRequest>(request)

    if (!body?.email) {
      return HttpResponse.json(
        {
          message: 'Email is required',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Simulate email not found
    if (!mockUsers.has(body.email)) {
      // Return success anyway for security (don't reveal if email exists)
      return HttpResponse.json({
        message:
          'If an account exists with this email, a password reset link has been sent',
      })
    }

    return HttpResponse.json({
      message: 'Password reset instructions sent to your email',
    })
  }),

  /**
   * POST /auth/reset-password
   * Resets password using reset token
   */
  http.post(`${API_URL}/auth/reset-password`, async ({ request }) => {
    await delay(400)

    const body = await validateRequestBody<ResetPasswordRequest>(request)

    if (!body?.token || !body?.password) {
      return HttpResponse.json(
        {
          message: 'Reset token and new password are required',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    if (body.password.length < 8) {
      return HttpResponse.json(
        {
          message: 'Password must be at least 8 characters long',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Simulate invalid or expired token
    if (body.token.length < 10) {
      return HttpResponse.json(
        {
          message: 'Invalid or expired reset token',
          statusCode: 400,
          error: 'INVALID_TOKEN',
        },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      message: 'Password reset successfully',
    })
  }),

  // ==================== MAGIC LINK ENDPOINTS ====================

  /**
   * POST /auth/magic-link/request
   * Requests a magic link to be sent to user's email
   */
  http.post(`${API_URL}/auth/magic-link/request`, async ({ request }) => {
    await delay(400)

    const body = await validateRequestBody<MagicLinkRequest>(request)

    if (!body?.email) {
      return HttpResponse.json(
        {
          message: 'Email is required',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Simulate email not found
    if (!mockUsers.has(body.email)) {
      return HttpResponse.json({
        message:
          'If an account exists with this email, a magic link has been sent',
      })
    }

    return HttpResponse.json({
      message: 'Magic link sent to your email',
      // In development, include the magic link for testing
      ...(process.env.NODE_ENV === 'development' && {
        devMagicLink: `http://localhost:3000/auth/magic-link/verify?token=mock-magic-token-${Date.now()}`,
      }),
    })
  }),

  /**
   * POST /auth/magic-link/verify
   * Verifies magic link and returns authentication tokens
   */
  http.post(`${API_URL}/auth/magic-link/verify`, async ({ request }) => {
    await delay(300)

    const body = await parseRequestBody(request)
    const token = body?.token as string | undefined

    if (!token) {
      return HttpResponse.json(
        {
          message: 'Magic link token is required',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Simulate invalid token
    if (token.length < 10) {
      return HttpResponse.json(
        {
          message: 'Invalid or expired magic link',
          statusCode: 400,
          error: 'INVALID_TOKEN',
        },
        { status: 400 }
      )
    }

    // Simulate token for a demo user
    const tokens = generateTokens()
    return HttpResponse.json({
      ...tokens,
      user: mockUsers.get('demo@example.com')?.user,
    })
  }),

  // ==================== OTP ENDPOINTS ====================

  /**
   * POST /auth/otp/request
   * Requests OTP to be sent to user's phone
   */
  http.post(`${API_URL}/auth/otp/request`, async ({ request }) => {
    await delay(400)

    const body = await validateRequestBody<OTPRequest>(request)

    if (!body?.phone) {
      return HttpResponse.json(
        {
          message: 'Phone number is required',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Simulate invalid phone format
    if (!/^\+?[1-9]\d{1,14}$/.test(body.phone)) {
      return HttpResponse.json(
        {
          message: 'Invalid phone number format',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      message: 'OTP sent successfully',
      // In development, include OTP for testing
      ...(process.env.NODE_ENV === 'development' && {
        devOtp: '123456',
      }),
    })
  }),

  /**
   * POST /auth/otp/verify
   * Verifies OTP and returns authentication tokens
   */
  http.post(`${API_URL}/auth/otp/verify`, async ({ request }) => {
    await delay(300)

    const body = await parseRequestBody(request)
    const phone = body?.phone as string | undefined
    const code = body?.code as string | undefined

    if (!phone || !code) {
      return HttpResponse.json(
        {
          message: 'Phone number and OTP code are required',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Simulate invalid OTP
    if (code !== '123456') {
      return HttpResponse.json(
        { message: 'Invalid OTP code', statusCode: 401, error: 'INVALID_OTP' },
        { status: 401 }
      )
    }

    const tokens = generateTokens()
    return HttpResponse.json({
      ...tokens,
      user: mockUsers.get('demo@example.com')?.user,
    })
  }),

  // ==================== TWO-FACTOR AUTHENTICATION ENDPOINTS ====================

  /**
   * POST /auth/2fa/enroll
   * Enrolls user in two-factor authentication
   */
  http.post(`${API_URL}/auth/2fa/enroll`, async ({ request }) => {
    await delay(500)

    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          message: 'Authentication required',
          statusCode: 401,
          error: 'UNAUTHORIZED',
        },
        { status: 401 }
      )
    }

    // Generate mock 2FA setup data
    const secret = `MOCK2FA${Math.random().toString(36).substring(2, 15).toUpperCase()}`

    return HttpResponse.json({
      qrCode: `otpauth://totp/M-Tracking:${mockUsers.get('test@example.com')?.user.email}?secret=${secret}&issuer=M-Tracking&algorithm=SHA1&digits=6&period=30`,
      secret: secret,
      backupCodes: [
        'ABCD-EFGH-IJKL',
        'MNOP-QRST-UVWX',
        'YZ12-3456-7890',
        'ABCD-EFGH-IJKL',
        'MNOP-QRST-UVWX',
        'YZ12-3456-7890',
        'ABCD-EFGH-IJKL',
        'MNOP-QRST-UVWX',
      ],
    })
  }),

  /**
   * POST /auth/2fa/verify
   * Verifies 2FA setup with OTP code
   */
  http.post(`${API_URL}/auth/2fa/verify`, async ({ request }) => {
    await delay(300)

    const body = await parseRequestBody(request)
    const code = body?.code as string | undefined

    if (!code) {
      return HttpResponse.json(
        {
          message: '2FA code is required',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Simulate invalid 2FA code
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return HttpResponse.json(
        { message: 'Invalid 2FA code', statusCode: 401, error: 'INVALID_2FA' },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      message: 'Two-factor authentication enabled successfully',
    })
  }),

  /**
   * GET /auth/2fa/backup-codes
   * Returns backup codes for 2FA
   */
  http.get(`${API_URL}/auth/2fa/backup-codes`, async ({ request }) => {
    await delay(200)

    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          message: 'Authentication required',
          statusCode: 401,
          error: 'UNAUTHORIZED',
        },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      codes: [
        'BKUP-1234-5678',
        'BKUP-9012-3456',
        'BKUP-7890-1234',
        'BKUP-5678-9012',
        'BKUP-3456-7890',
        'BKUP-1234-5678',
        'BKUP-9012-3456',
        'BKUP-7890-1234',
      ],
    })
  }),

  /**
   * POST /auth/2fa/disable
   * Disables two-factor authentication
   */
  http.post(`${API_URL}/auth/2fa/disable`, async ({ request }) => {
    await delay(400)

    const body = await parseRequestBody(request)
    const code = body?.code as string | undefined

    if (!code) {
      return HttpResponse.json(
        {
          message: '2FA code is required to disable',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Simulate invalid 2FA code
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return HttpResponse.json(
        { message: 'Invalid 2FA code', statusCode: 401, error: 'INVALID_2FA' },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      message: 'Two-factor authentication disabled successfully',
    })
  }),

  /**
   * POST /auth/2fa/validate
   * Validates 2FA code during login
   */
  http.post(`${API_URL}/auth/2fa/validate`, async ({ request }) => {
    await delay(300)

    const body = await parseRequestBody(request)
    const code = body?.code as string | undefined
    const email = body?.email as string | undefined

    if (!code || !email) {
      return HttpResponse.json(
        {
          message: '2FA code and email are required',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Simulate invalid 2FA code
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return HttpResponse.json(
        { message: 'Invalid 2FA code', statusCode: 401, error: 'INVALID_2FA' },
        { status: 401 }
      )
    }

    const userRecord = mockUsers.get(email)
    if (!userRecord) {
      return HttpResponse.json(
        { message: 'User not found', statusCode: 404, error: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    const tokens = generateTokens()
    return HttpResponse.json({
      ...tokens,
      user: userRecord.user,
    })
  }),
]
