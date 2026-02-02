/**
 * Auth API Tests
 *
 * Comprehensive tests for authentication API using MSW mock handlers.
 * Tests cover all authentication flows: login, register, logout, token refresh,
 * password reset, magic link, OTP, and 2FA.
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
  vi,
} from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const API_URL = 'http://localhost:4000/api/v1'

// Mock modules
const mockTokenService = {
  setToken: vi.fn(),
  clearToken: vi.fn(),
  getToken: vi.fn(() => 'mock-token' as string | null),
  setRefreshCallback: vi.fn(),
}

vi.mock('../services/token-service', () => ({
  tokenService: mockTokenService,
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

// Dynamically imported module
let authApi: typeof import('./auth-api').authApi
let tokenService: typeof mockTokenService

// Create MSW handlers with correct API URL
const handlers = [
  // Login
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }

    if (!body.email || !body.password) {
      return HttpResponse.json(
        { message: 'Email and password are required', statusCode: 400 },
        { status: 400 }
      )
    }

    const mockUsers: Record<string, { password: string; user: object }> = {
      'test@example.com': {
        password: 'password123',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: false,
          twoFactorEnabled: false,
          roles: ['USER'],
        },
      },
      'demo@example.com': {
        password: 'demo123',
        user: {
          id: 'user-456',
          email: 'demo@example.com',
          name: 'Demo User',
          emailVerified: true,
          twoFactorEnabled: false,
          roles: ['USER'],
        },
      },
    }

    const userRecord = mockUsers[body.email]
    if (!userRecord || userRecord.password !== body.password) {
      return HttpResponse.json(
        { message: 'Invalid email or password', statusCode: 401 },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      user: userRecord.user,
    })
  }),

  // Logout
  http.post(`${API_URL}/auth/logout`, () => {
    return HttpResponse.json({ message: 'Logged out successfully' })
  }),

  // Refresh
  http.post(`${API_URL}/auth/refresh`, ({ request }) => {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'Invalid refresh token', statusCode: 401 },
        { status: 401 }
      )
    }
    return HttpResponse.json({
      accessToken: 'new-mock-access-token',
      expiresIn: 3600,
    })
  }),

  // Register
  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string
      password: string
      name: string
    }

    if (!body.email || !body.password || !body.name) {
      return HttpResponse.json(
        { message: 'Email, password, and name are required', statusCode: 400 },
        { status: 400 }
      )
    }

    if (body.password.length < 8) {
      return HttpResponse.json(
        { message: 'Password must be at least 8 characters', statusCode: 400 },
        { status: 400 }
      )
    }

    if (body.email === 'test@example.com') {
      return HttpResponse.json(
        { message: 'Email already exists', statusCode: 409 },
        { status: 409 }
      )
    }

    return HttpResponse.json(
      {
        message:
          'Registration successful. Please check your email to verify your account.',
      },
      { status: 201 }
    )
  }),

  // Verify email
  http.post(`${API_URL}/auth/verify-email`, async ({ request }) => {
    const body = (await request.json()) as { token: string }
    if (!body.token || body.token.length < 10) {
      return HttpResponse.json(
        { message: 'Invalid or expired verification token', statusCode: 400 },
        { status: 400 }
      )
    }
    return HttpResponse.json({ message: 'Email verified successfully' })
  }),

  // Resend verification
  http.post(`${API_URL}/auth/resend-verification`, async ({ request }) => {
    const body = (await request.json()) as { email: string }
    if (body.email === 'nonexistent@example.com') {
      return HttpResponse.json(
        { message: 'No account found with this email', statusCode: 404 },
        { status: 404 }
      )
    }
    return HttpResponse.json({
      message: 'Verification email sent successfully',
    })
  }),

  // Forgot password
  http.post(`${API_URL}/auth/forgot-password`, () => {
    return HttpResponse.json({
      message: 'If an account exists, a password reset link has been sent',
    })
  }),

  // Reset password
  http.post(`${API_URL}/auth/reset-password`, async ({ request }) => {
    const body = (await request.json()) as { token: string; password: string }
    if (!body.token || body.token.length < 10) {
      return HttpResponse.json(
        { message: 'Invalid or expired reset token', statusCode: 400 },
        { status: 400 }
      )
    }
    if (body.password.length < 8) {
      return HttpResponse.json(
        { message: 'Password must be at least 8 characters', statusCode: 400 },
        { status: 400 }
      )
    }
    return HttpResponse.json({ message: 'Password reset successfully' })
  }),

  // Magic link request
  http.post(`${API_URL}/auth/magic-link/request`, () => {
    return HttpResponse.json({ message: 'Magic link sent to your email' })
  }),

  // Magic link verify
  http.post(`${API_URL}/auth/magic-link/verify`, async ({ request }) => {
    const body = (await request.json()) as { token: string }
    if (!body.token || body.token.length < 10) {
      return HttpResponse.json(
        { message: 'Invalid or expired magic link', statusCode: 400 },
        { status: 400 }
      )
    }
    return HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      user: { id: 'user-456', email: 'demo@example.com', name: 'Demo User' },
    })
  }),

  // OTP request
  http.post(`${API_URL}/auth/otp/request`, async ({ request }) => {
    const body = (await request.json()) as { phone: string }
    if (!/^\+?[1-9]\d{1,14}$/.test(body.phone)) {
      return HttpResponse.json(
        { message: 'Invalid phone number format', statusCode: 400 },
        { status: 400 }
      )
    }
    return HttpResponse.json({ message: 'OTP sent successfully' })
  }),

  // OTP verify
  http.post(`${API_URL}/auth/otp/verify`, async ({ request }) => {
    const body = (await request.json()) as { phone: string; code: string }
    if (body.code !== '123456') {
      return HttpResponse.json(
        { message: 'Invalid OTP code', statusCode: 401 },
        { status: 401 }
      )
    }
    return HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      user: { id: 'user-456', email: 'demo@example.com', name: 'Demo User' },
    })
  }),

  // 2FA enroll
  http.post(`${API_URL}/auth/2fa/enroll`, () => {
    return HttpResponse.json({
      qrCode:
        'otpauth://totp/M-Tracking:test@example.com?secret=MOCK2FA123&issuer=M-Tracking',
      secret: 'MOCK2FA123',
    })
  }),

  // 2FA verify setup
  http.post(`${API_URL}/auth/2fa/verify`, async ({ request }) => {
    const body = (await request.json()) as { code: string }
    if (!/^\d{6}$/.test(body.code)) {
      return HttpResponse.json(
        { message: 'Invalid 2FA code', statusCode: 401 },
        { status: 401 }
      )
    }
    return HttpResponse.json({
      message: 'Two-factor authentication enabled successfully',
    })
  }),

  // 2FA backup codes
  http.get(`${API_URL}/auth/2fa/backup-codes`, () => {
    return HttpResponse.json({
      codes: ['BKUP-1234-5678', 'BKUP-9012-3456', 'BKUP-7890-1234'],
    })
  }),

  // 2FA disable
  http.post(`${API_URL}/auth/2fa/disable`, async ({ request }) => {
    const body = (await request.json()) as { code: string }
    if (!/^\d{6}$/.test(body.code)) {
      return HttpResponse.json(
        { message: 'Invalid 2FA code', statusCode: 401 },
        { status: 401 }
      )
    }
    return HttpResponse.json({
      message: 'Two-factor authentication disabled successfully',
    })
  }),

  // 2FA validate during login
  http.post(`${API_URL}/auth/2fa/validate`, async ({ request }) => {
    const body = (await request.json()) as { code: string; email: string }
    if (!/^\d{6}$/.test(body.code)) {
      return HttpResponse.json(
        { message: 'Invalid 2FA code', statusCode: 401 },
        { status: 401 }
      )
    }
    return HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      user: { id: 'user-123', email: body.email, name: 'Test User' },
    })
  }),
]

// Setup MSW server with handlers
const server = setupServer(...handlers)

beforeAll(async () => {
  // Set environment variable before importing api-client
  vi.stubEnv('NEXT_PUBLIC_API_URL', API_URL)

  // Reset modules to ensure fresh imports
  vi.resetModules()

  // Dynamically import after env is set
  const authApiModule = await import('./auth-api')
  authApi = authApiModule.authApi

  tokenService = mockTokenService

  server.listen({ onUnhandledRequest: 'bypass' })
})

beforeEach(() => {
  // Reset token mock to default
  mockTokenService.getToken.mockReturnValue('mock-token')
})

afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})

afterAll(() => {
  server.close()
  vi.unstubAllEnvs()
})

describe('Auth API', () => {
  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const result = await authApi.login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('user')
      expect(result.user?.email).toBe('test@example.com')
      expect(tokenService.setToken).toHaveBeenCalled()
    })

    it('should login with demo user', async () => {
      const result = await authApi.login({
        email: 'demo@example.com',
        password: 'demo123',
      })

      expect(result.user?.email).toBe('demo@example.com')
      expect(result.user?.emailVerified).toBe(true)
    })

    it('should reject invalid credentials', async () => {
      await expect(
        authApi.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid email or password')
    })

    it('should reject missing email or password', async () => {
      await expect(
        authApi.login({
          email: '',
          password: 'password123',
        })
      ).rejects.toThrow()
    })
  })

  describe('Register', () => {
    it('should register successfully with valid data', async () => {
      const result = await authApi.register({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User',
      })

      expect(result).toHaveProperty('message')
      expect(result.message).toContain('Registration successful')
    })

    it('should reject duplicate email', async () => {
      await expect(
        authApi.register({
          email: 'test@example.com', // Existing email
          password: 'SecurePass123!',
          name: 'Test User',
        })
      ).rejects.toThrow()
    })

    it('should reject weak password', async () => {
      await expect(
        authApi.register({
          email: 'weak@example.com',
          password: 'short', // Less than 8 chars
          name: 'Test User',
        })
      ).rejects.toThrow()
    })

    it('should reject missing fields', async () => {
      await expect(
        authApi.register({
          email: 'missing@example.com',
          password: 'SecurePass123!',
          name: '', // Missing name
        })
      ).rejects.toThrow()
    })
  })

  describe('Logout', () => {
    it('should logout successfully', async () => {
      await authApi.logout()

      expect(tokenService.clearToken).toHaveBeenCalled()
    })
  })

  describe('Token Refresh', () => {
    it('should refresh token successfully when authorized', async () => {
      const result = await authApi.refresh()

      // Since getToken returns 'mock-token', auth header is present, refresh succeeds
      expect(result).toHaveProperty('accessToken')
      expect(tokenService.setToken).toHaveBeenCalled()
    })

    it('should return null if refresh fails', async () => {
      // Override getToken to return null for this test
      vi.mocked(tokenService.getToken).mockReturnValueOnce(null)

      // Override handler to reject without auth
      server.use(
        http.post(`${API_URL}/auth/refresh`, () => {
          return HttpResponse.json(
            { message: 'Invalid refresh token', statusCode: 401 },
            { status: 401 }
          )
        })
      )

      const result = await authApi.refresh()

      expect(result).toBeNull()
      expect(tokenService.clearToken).toHaveBeenCalled()
    })
  })

  describe('Email Verification', () => {
    it('should verify email with valid token', async () => {
      const result = await authApi.verifyEmail({
        token: 'valid-verification-token-12345',
      })

      expect(result.message).toBe('Email verified successfully')
    })

    it('should reject invalid token', async () => {
      await expect(
        authApi.verifyEmail({
          token: 'short', // Too short
        })
      ).rejects.toThrow()
    })

    it('should resend verification email', async () => {
      const result = await authApi.resendVerification('test@example.com')

      expect(result.message).toBe('Verification email sent successfully')
    })

    it('should reject resend for non-existent email', async () => {
      await expect(
        authApi.resendVerification('nonexistent@example.com')
      ).rejects.toThrow()
    })
  })

  describe('Password Reset', () => {
    it('should send forgot password email', async () => {
      const result = await authApi.forgotPassword({
        email: 'test@example.com',
      })

      expect(result.message).toContain('password reset')
    })

    it('should not reveal if email exists', async () => {
      // For security, should return success even for non-existent email
      const result = await authApi.forgotPassword({
        email: 'nonexistent@example.com',
      })

      expect(result.message).toBeTruthy()
    })

    it('should reset password with valid token', async () => {
      const result = await authApi.resetPassword({
        token: 'valid-reset-token-12345',
        password: 'NewSecurePass123!',
      })

      expect(result.message).toBe('Password reset successfully')
    })

    it('should reject weak password in reset', async () => {
      await expect(
        authApi.resetPassword({
          token: 'valid-reset-token-12345',
          password: 'weak', // Less than 8 chars
        })
      ).rejects.toThrow()
    })

    it('should reject invalid reset token', async () => {
      await expect(
        authApi.resetPassword({
          token: 'short', // Too short
          password: 'NewSecurePass123!',
        })
      ).rejects.toThrow()
    })
  })

  describe('Magic Link', () => {
    it('should request magic link', async () => {
      const result = await authApi.requestMagicLink('test@example.com')

      expect(result.message).toContain('Magic link sent')
    })

    it('should verify magic link and return tokens', async () => {
      const result = await authApi.verifyMagicLink(
        'valid-magic-link-token-12345'
      )

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('user')
      expect(tokenService.setToken).toHaveBeenCalled()
    })

    it('should reject invalid magic link token', async () => {
      await expect(authApi.verifyMagicLink('short')).rejects.toThrow()
    })
  })

  describe('OTP', () => {
    it('should request OTP', async () => {
      const result = await authApi.requestOtp('+1234567890')

      expect(result.message).toBe('OTP sent successfully')
    })

    it('should reject invalid phone format', async () => {
      await expect(authApi.requestOtp('invalid')).rejects.toThrow()
    })

    it('should verify OTP and return tokens', async () => {
      const result = await authApi.verifyOtp('+1234567890', '123456')

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('user')
      expect(tokenService.setToken).toHaveBeenCalled()
    })

    it('should reject invalid OTP code', async () => {
      await expect(
        authApi.verifyOtp('+1234567890', '000000') // Wrong code
      ).rejects.toThrow()
    })
  })

  describe('Two-Factor Authentication', () => {
    beforeEach(() => {
      // Mock token for authenticated requests
      vi.mocked(tokenService.getToken).mockReturnValue('mock-token')
    })

    it('should enroll in 2FA', async () => {
      const result = await authApi.enroll2FA()

      expect(result).toHaveProperty('qrCode')
      expect(result).toHaveProperty('secret')
      expect(result.qrCode).toContain('otpauth://totp/')
    })

    it('should verify 2FA setup', async () => {
      const result = await authApi.verify2FASetup('123456')

      expect(result.message).toContain('Two-factor authentication enabled')
    })

    it('should reject invalid 2FA code in setup', async () => {
      await expect(authApi.verify2FASetup('abc')).rejects.toThrow()
    })

    it('should get backup codes', async () => {
      const result = await authApi.getBackupCodes()

      expect(result).toHaveProperty('codes')
      expect(Array.isArray(result.codes)).toBe(true)
      expect(result.codes.length).toBeGreaterThan(0)
    })

    it('should disable 2FA', async () => {
      const result = await authApi.disable2FA('123456')

      expect(result.message).toContain('Two-factor authentication disabled')
    })

    it('should validate 2FA during login', async () => {
      const result = await authApi.validate2FA('123456', 'test@example.com')

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('user')
      expect(tokenService.setToken).toHaveBeenCalled()
    })

    it('should reject invalid 2FA code during login validation', async () => {
      await expect(
        authApi.validate2FA('abc', 'test@example.com')
      ).rejects.toThrow()
    })
  })
})
