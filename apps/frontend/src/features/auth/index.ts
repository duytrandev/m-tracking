/**
 * Auth feature public API
 * 
 * Barrel export to prevent deep imports and establish clear feature boundaries.
 * Import from '@/features/auth' instead of '@/features/auth/store/auth-store'
 */

// Store
export { useAuthStore, useUser, useIsAuthenticated, useIsAuthLoading } from './store/auth-store'
export type { User, AuthState } from './store/auth-store'

// Hooks
export { useAuth } from './hooks/use-auth'
export { useAuthInit } from './hooks/use-auth-init'
export { useLogin } from './hooks/use-login'
export { useLogout } from './hooks/use-logout'
export { useRegister } from './hooks/use-register'
export { use2FASetup } from './hooks/use-2fa-setup'
export { use2FAVerify } from './hooks/use-2fa-verify'
export { useForgotPassword } from './hooks/use-forgot-password'
export { useResetPassword } from './hooks/use-reset-password'
export { useVerifyEmail } from './hooks/use-verify-email'
export { useMagicLinkRequest } from './hooks/use-magic-link-request'
export { useMagicLinkVerify } from './hooks/use-magic-link-verify'
export { useOtpRequest } from './hooks/use-otp-request'
export { useOtpVerify } from './hooks/use-otp-verify'
export { useOAuth } from './hooks/use-oauth'

// Components
export { AuthInitializer } from './components/auth-initializer'
export { LoginForm } from './components/login-form'
export { RegisterForm } from './components/register-form'

// API (optional, if needed externally)
export { authApi } from './api/auth-api'
