'use client'

import { Menu, Sun, Moon, LogOut, ShieldCheck, Building2, Wrench, Briefcase, User, MessageSquare } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth-context'
import Link from 'next/link'

interface TopbarProps {
  onMenuClick: () => void
  title: string
}

export function Topbar({ onMenuClick, title }: TopbarProps) {
  const { theme, setTheme } = useTheme()
  const { user, role, logout } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const getRoleBadge = () => {
    if (role === 'super_admin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 text-xs font-semibold text-blue-700 dark:text-blue-300">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Super Admin
        </span>
      )
    }
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          <Briefcase className="w-3.5 h-3.5" />
          Admin Staff
        </span>
      )
    }
    if (role === 'landlord') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <Building2 className="w-3.5 h-3.5" />
          Landlord Portal
        </span>
      )
    }
    if (role === 'agent') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-700 text-xs font-semibold text-purple-700 dark:text-purple-300">
          <Wrench className="w-3.5 h-3.5" />
          Agent Portal
        </span>
      )
    }
    return null
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 lg:px-6 shadow-xs">
      {/* Left: Hamburger + Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{title}</h1>
          <p className="text-xs text-gray-400 hidden sm:block">Logged in as {user?.name}</p>
        </div>
      </div>

      {/* Right: Role Badge + Dark/Light Toggle + Messages + User Avatar */}
      <div className="flex items-center gap-3">
        {/* Active Role Badge */}
        <div className="hidden sm:block">
          {getRoleBadge()}
        </div>

        {/* Messages quick-link */}
        <Link
          href="/messages"
          className="p-2 rounded-lg text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
          title="Messages"
        >
          <MessageSquare className="h-4 w-4" />
        </Link>

        {/* Dark/Light Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        )}

        {/* User avatar + sign out */}
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
          <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
              role === 'super_admin' || role === 'admin' ? 'bg-blue-600' :
              role === 'landlord' ? 'bg-emerald-600' : 'bg-purple-600'
            }`}>
              {user?.name?.charAt(0) || <User className="w-4 h-4" />}
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200 hidden lg:block max-w-[120px] truncate">
              {user?.name}
            </span>
          </Link>
          <button
            onClick={logout}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
