/**
 * Profile feature public API
 *
 * Barrel export to prevent deep imports and establish clear feature boundaries.
 */

// Hooks
export { useProfile } from './hooks/use-profile'
export { useAvatarUpload } from './hooks/use-avatar-upload'
export { useSessions } from './hooks/use-sessions'

// Components
export { ProfileForm } from './components/profile-form'
export { AvatarUpload } from './components/avatar-upload'
export { PasswordChangeForm } from './components/password-change-form'
export { SessionsList } from './components/sessions-list'

// API
export { profileApi } from './api/profile-api'
