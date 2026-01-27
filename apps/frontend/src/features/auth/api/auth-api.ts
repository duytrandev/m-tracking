import { apiClient, setAuthToken, clearAuthToken } from '@/lib/api-client'
import { createAppError, ApiErrorCode } from '@/lib/api-errors'
import { tokenService } from '../services/token-service'
import type {
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  MessageResponse,
  BackupCodesResponse,
} from '@/types/api/auth'
import type { User } from '@/types/entities'
import type { LoginResponse } from '@/types/api/auth'

// Note: AuthResponse was renamed to LoginResponse in centralized types
// TwoFactorEnrollResponse is now Enable2FAResponse
type AuthResponse = LoginResponse
type TwoFactorEnrollResponse = {
  qrCode: string
  secret: string
}

export const authApi = {
  // Registration
  register: async (data: RegisterRequest): Promise<MessageResponse> => {
    try {
      const response = await apiClient.post<MessageResponse>(
        '/auth/register',
        data
      )
      return response.data
    } catch (error) {
      const appError = createAppError(error)

      if (appError.code === ApiErrorCode.VALIDATION) {
        throw new Error(appError.message || 'Please check your input')
      }
      if (appError.code === ApiErrorCode.NETWORK_ERROR) {
        throw new Error(
          'Unable to connect. Please check your internet connection.'
        )
      }

      throw new Error(appError.message)
    }
  },

  // Login
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', data)
      if (response.data.accessToken) {
        setAuthToken(response.data.accessToken, response.data.expiresIn)
      }
      return response.data
    } catch (error) {
      const appError = createAppError(error)

      // Specific error handling for login
      if (appError.code === ApiErrorCode.UNAUTHORIZED) {
        throw new Error('Invalid email or password')
      }
      if (appError.code === ApiErrorCode.VALIDATION) {
        throw new Error(appError.message || 'Please check your input')
      }
      if (appError.code === ApiErrorCode.NETWORK_ERROR) {
        throw new Error(
          'Unable to connect. Please check your internet connection.'
        )
      }

      throw new Error(appError.message)
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      clearAuthToken()
    }
  },

  // Refresh token - returns new access token
  refresh: async (): Promise<AuthResponse | null> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/refresh')
      if (response.data.accessToken) {
        setAuthToken(response.data.accessToken, response.data.expiresIn)
      }
      return response.data
    } catch {
      clearAuthToken()
      return null
    }
  },

  // Email verification
  verifyEmail: async (data: VerifyEmailRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(
      '/auth/verify-email',
      data
    )
    return response.data
  },

  resendVerification: async (email: string): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(
      '/auth/resend-verification',
      { email }
    )
    return response.data
  },

  // Password reset
  forgotPassword: async (
    data: ForgotPasswordRequest
  ): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(
      '/auth/forgot-password',
      data
    )
    return response.data
  },

  resetPassword: async (
    data: ResetPasswordRequest
  ): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(
      '/auth/reset-password',
      data
    )
    return response.data
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me')
    return response.data
  },

  // Magic Link
  requestMagicLink: async (email: string): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(
      '/auth/magic-link/request',
      { email }
    )
    return response.data
  },

  verifyMagicLink: async (token: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      '/auth/magic-link/verify',
      { token }
    )
    if (response.data.accessToken) {
      setAuthToken(response.data.accessToken, response.data.expiresIn)
    }
    return response.data
  },

  // SMS OTP
  requestOtp: async (phone: string): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(
      '/auth/otp/request',
      { phone }
    )
    return response.data
  },

  verifyOtp: async (phone: string, code: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/otp/verify', {
      phone,
      code,
    })
    if (response.data.accessToken) {
      setAuthToken(response.data.accessToken, response.data.expiresIn)
    }
    return response.data
  },

  // Two-Factor Authentication (2FA)
  enroll2FA: async (): Promise<TwoFactorEnrollResponse> => {
    const response =
      await apiClient.post<TwoFactorEnrollResponse>('/auth/2fa/enroll')
    return response.data
  },

  verify2FASetup: async (code: string): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/2fa/verify', {
      code,
    })
    return response.data
  },

  getBackupCodes: async (): Promise<BackupCodesResponse> => {
    const response = await apiClient.get<BackupCodesResponse>(
      '/auth/2fa/backup-codes'
    )
    return response.data
  },

  disable2FA: async (code: string): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(
      '/auth/2fa/disable',
      { code }
    )
    return response.data
  },

  validate2FA: async (code: string, email: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/2fa/validate', {
      code,
      email,
    })
    if (response.data.accessToken) {
      setAuthToken(response.data.accessToken, response.data.expiresIn)
    }
    return response.data
  },
}

// Set up refresh callback for automatic token refresh
tokenService.setRefreshCallback(async () => {
  const result = await authApi.refresh()
  return result?.accessToken || null
})
