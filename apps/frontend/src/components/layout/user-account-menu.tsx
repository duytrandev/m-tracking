'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useTheme } from '@/hooks/use-theme'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu'
import {
  ChevronDown,
  ChevronUp,
  Settings,
  LogOut,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserAccountMenuProps {
  /** Optional className for styling */
  className?: string
}

/**
 * User Account Dropdown Menu
 *
 * Features:
 * - User avatar with initials
 * - User name and email display
 * - Theme selection (Light/Dark/System)
 * - Settings navigation
 * - Logout action
 *
 * Accessibility:
 * - Keyboard navigation (Tab, Enter, Arrows, Esc)
 * - ARIA labels and roles
 * - Focus management
 */
export function UserAccountMenu({ className }: UserAccountMenuProps) {
  const { user, logout, isLoggingOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U'

  const handleLogout = async () => {
    setOpen(false)
    await logout()
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2',
          'hover:bg-accent transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'data-[state=open]:bg-accent',
          className
        )}
        aria-label="Open account menu"
      >
        {/* User Avatar */}
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary">
          <span className="text-sm font-medium text-primary-foreground">
            {userInitial}
          </span>
        </div>

        {/* User Info */}
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium">{user?.name || 'User'}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>

        {/* Chevron Icon */}
        {open ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="top"
        className="w-64"
        sideOffset={8}
      >
        {/* Header */}
        <DropdownMenuLabel>My Account</DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Theme Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="mr-2 h-4 w-4" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={(value) =>
                  handleThemeChange(value as 'light' | 'dark' | 'system')
                }
              >
                <DropdownMenuRadioItem value="light">
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Settings Link */}
        <DropdownMenuItem asChild>
          <Link
            href="/settings"
            className="cursor-pointer"
            onClick={() => setOpen(false)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout (Destructive) */}
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? 'Logging out...' : 'Log out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
