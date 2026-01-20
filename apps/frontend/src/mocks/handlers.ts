import { http, HttpResponse } from 'msw'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const handlers = [
  // Auth Handlers
  http.post(`${API_URL}/auth/login`, async () => {
    return HttpResponse.json({
      accessToken: 'mock-access-token-' + Date.now(),
      expiresIn: 3600,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      },
    })
  }),

  http.post(`${API_URL}/auth/register`, async () => {
    return HttpResponse.json({
      message: 'Registration successful',
    })
  }),

  http.post(`${API_URL}/auth/logout`, async () => {
    return HttpResponse.json({
      message: 'Logged out successfully',
    })
  }),

  http.post(`${API_URL}/auth/refresh`, async () => {
    return HttpResponse.json({
      accessToken: 'mock-refreshed-token-' + Date.now(),
      expiresIn: 3600,
    })
  }),

  // User Handlers
  http.get(`${API_URL}/users/me`, async () => {
    return HttpResponse.json({
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }),
]
