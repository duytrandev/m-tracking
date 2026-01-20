import { redirect } from 'next/navigation'

/**
 * Settings root page
 * Redirects to profile settings by default
 */
export default function SettingsPage() {
  redirect('/settings/profile')
}
