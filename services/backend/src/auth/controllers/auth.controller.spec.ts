/**
 * Auth Controller Tests
 *
 * Tests for authentication controller endpoints.
 * Verifies HTTP request handling, validation, and response formatting.
 */

import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthController } from './auth.controller'
import { AuthService } from '../services/auth.service'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { AuthException } from '../../common/exceptions/auth.exception'
import type { Request, Response } from 'express'

describe('AuthController', () => {
  let controller: AuthController
  let authService: AuthService

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatar: '',
    roles: ['user'],
  }

  const mockRequest = {
    headers: {
      'user-agent': 'Test Browser',
      'sec-ch-ua-platform': 'macOS',
      authorization: 'Bearer mock-access-token',
    },
    ip: '127.0.0.1',
    cookies: {
      refreshToken: 'mock-refresh-token',
    },
  } as unknown as Request

  const mockResponse = {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  } as unknown as Response

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: vi.fn(),
            validateUser: vi.fn(),
            login: vi.fn(),
            refresh: vi.fn(),
            logout: vi.fn(),
            verifyEmail: vi.fn(),
            forgotPassword: vi.fn(),
            resetPassword: vi.fn(),
          },
        },
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    authService = module.get<AuthService>(AuthService)
  })

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const dto = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        name: 'New User',
      }

      vi.spyOn(authService, 'register').mockResolvedValue({
        message:
          'Registration successful. Please check your email to verify your account.',
      })

      const result = await controller.register(dto)

      expect(result.message).toContain('Registration successful')
      expect(authService.register).toHaveBeenCalledWith(dto)
    })

    it('should reject duplicate email', async () => {
      const dto = {
        email: 'existing@example.com',
        password: 'SecurePassword123!',
        name: 'Existing User',
      }

      vi.spyOn(authService, 'register').mockRejectedValue(
        new ConflictException('Email already exists')
      )

      await expect(controller.register(dto)).rejects.toThrow(ConflictException)
    })
  })

  describe('POST /auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      vi.spyOn(authService, 'verifyEmail').mockResolvedValue({
        message: 'Email verified successfully',
      })

      const result = await controller.verifyEmail({
        token: 'valid-verification-token',
      })

      expect(result.message).toBe('Email verified successfully')
      expect(authService.verifyEmail).toHaveBeenCalledWith(
        'valid-verification-token'
      )
    })
  })

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password123',
      }

      const loginResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 900,
        user: mockUser,
      }

      vi.spyOn(authService, 'validateUser').mockResolvedValue(mockUser as never)
      vi.spyOn(authService, 'login').mockResolvedValue(loginResponse)

      const result = await controller.login(dto, mockRequest, mockResponse)

      expect(result.accessToken).toBe('mock-access-token')
      expect(result.user).toEqual(mockUser)
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'mock-refresh-token',
        expect.objectContaining({
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
      )
    })

    it('should reject invalid credentials', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      vi.spyOn(authService, 'validateUser').mockResolvedValue(null)

      await expect(
        controller.login(dto, mockRequest, mockResponse)
      ).rejects.toThrow(AuthException)
    })
  })

  describe('POST /auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const refreshResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900,
      }

      vi.spyOn(authService, 'refresh').mockResolvedValue(refreshResponse)

      const result = await controller.refresh(mockRequest, mockResponse)

      expect(result.accessToken).toBe('new-access-token')
      expect(mockResponse.cookie).toHaveBeenCalled()
    })

    it('should reject if no refresh token in cookie', async () => {
      const reqWithoutCookie = {
        ...mockRequest,
        cookies: {},
      } as unknown as Request

      await expect(
        controller.refresh(reqWithoutCookie, mockResponse)
      ).rejects.toThrow(AuthException)
    })
  })

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const user = { userId: 'user-123', email: 'test@example.com' }

      vi.spyOn(authService, 'logout').mockResolvedValue(undefined)

      const result = await controller.logout(user, mockRequest, mockResponse)

      expect(result.message).toBe('Logged out successfully')
      expect(authService.logout).toHaveBeenCalledWith(
        'user-123',
        'mock-refresh-token',
        'mock-access-token'
      )
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken')
    })
  })

  describe('POST /auth/forgot-password', () => {
    it('should send password reset email', async () => {
      vi.spyOn(authService, 'forgotPassword').mockResolvedValue({
        message: 'If the email exists, a reset link has been sent.',
      })

      const result = await controller.forgotPassword({
        email: 'test@example.com',
      })

      expect(result.message).toContain('reset link has been sent')
    })

    it('should return same response for non-existent email (security)', async () => {
      vi.spyOn(authService, 'forgotPassword').mockResolvedValue({
        message: 'If the email exists, a reset link has been sent.',
      })

      const result = await controller.forgotPassword({
        email: 'nonexistent@example.com',
      })

      // Should NOT reveal if email exists
      expect(result.message).toContain('reset link has been sent')
    })
  })

  describe('POST /auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      vi.spyOn(authService, 'resetPassword').mockResolvedValue({
        message: 'Password reset successfully',
      })

      const result = await controller.resetPassword({
        token: 'valid-reset-token',
        password: 'NewSecurePassword123!',
      })

      expect(result.message).toBe('Password reset successfully')
      expect(authService.resetPassword).toHaveBeenCalledWith(
        'valid-reset-token',
        'NewSecurePassword123!'
      )
    })
  })
})
