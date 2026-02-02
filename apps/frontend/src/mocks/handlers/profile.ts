/**
 * Profile API Mock Handlers
 *
 * This module provides comprehensive mock handlers for all profile-related API endpoints.
 */

import { http, HttpResponse } from 'msw'
import type { User } from '@/types/entities'

// API base URL configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// In-memory user data store
let mockUser: User = {
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
} as unknown as User

/**
 * Simulate network delay for realistic testing
 */
const delay = (ms: number = 300) =>
  new Promise(resolve => setTimeout(resolve, ms))

export const profileHandlers = [
  /**
   * GET /users/me
   * Retrieves the current user's profile
   */
  http.get(`${API_URL}/users/me`, async ({ request }) => {
    await delay(300)

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

    return HttpResponse.json(mockUser)
  }),

  /**
   * PATCH /users/me
   * Updates the current user's profile
   */
  http.patch(`${API_URL}/users/me`, async ({ request }) => {
    await delay(400)

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

    const body = await request.json().catch(() => null)

    if (!body || typeof body !== 'object') {
      return HttpResponse.json(
        {
          message: 'Invalid request body',
          statusCode: 400,
          error: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // Update user with provided fields
    mockUser = {
      ...mockUser,
      ...(body as Record<string, unknown>),
      id: mockUser.id, // Prevent ID changes
      email: mockUser.email, // Prevent email changes
      createdAt: mockUser.createdAt, // Prevent createdAt changes
      updatedAt: new Date().toISOString(),
    } as unknown as User

    return HttpResponse.json({
      user: mockUser,
      message: 'Profile updated successfully',
    })
  }),

  /**
   * DELETE /users/me/avatar
   * Deletes the user's avatar
   */
  http.delete(`${API_URL}/users/me/avatar`, async ({ request }) => {
    await delay(300)

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
      message: 'Avatar deleted successfully',
    })
  }),

  /**
   * GET /users/me/sessions
   * Retrieves the user's active sessions
   */
  http.get(`${API_URL}/users/me/sessions`, async ({ request }) => {
    await delay(300)

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

    const sessions = [
      {
        id: 'session-1',
        deviceInfo: {
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          platform: 'macOS',
        },
        ipAddress: '192.168.1.1',
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        isCurrent: true,
      },
      {
        id: 'session-2',
        deviceInfo: {
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1) AppleWebKit/605.1.15',
          platform: 'iOS',
        },
        ipAddress: '192.168.1.2',
        lastActiveAt: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
        createdAt: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        isCurrent: false,
      },
    ]

    return HttpResponse.json(sessions)
  }),

  /**
   * DELETE /users/me/sessions/:id
   * Revokes a specific session
   */
  http.delete(
    `${API_URL}/users/me/sessions/:id`,
    async ({ params, request }) => {
      await delay(300)

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

      const { id } = params

      if (!id) {
        return HttpResponse.json(
          {
            message: 'Session ID is required',
            statusCode: 400,
            error: 'VALIDATION_ERROR',
          },
          { status: 400 }
        )
      }

      return HttpResponse.json({
        message: 'Session revoked successfully',
      })
    }
  ),

  /**
   * DELETE /users/me/sessions
   * Revokes all other sessions
   */
  http.delete(`${API_URL}/users/me/sessions`, async ({ request }) => {
    await delay(400)

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
      message: 'All other sessions revoked successfully',
    })
  }),
]
