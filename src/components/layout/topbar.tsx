'use client'

import { Menu, Sun, Moon, LogOut, ChevronDown, ShieldCheck, Building2, Wrench, UserCheck } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/components/providers/auth-context'
import Link from 'next/link'

interface TopbarProps {
  onMenuClick: () => void
  title: string
}

export function Topbar({ onMenuClick, title }: TopbarProps) {
  const { theme, setTheme } = useTheme()
  const { user, role, switchRole, switchLandlord, switchAgent, logout } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSwitcherOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getRoleBadge = () => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 text-xs font-semibold text-blue-700 dark:text-blue-300">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Super Admin
        </span>
      )
    }
    if (role === 'landlord') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Landlord Portal
        </span>
      )
    }
    if (role === 'agent') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-700 text-xs font-semibold text-purple-700 dark:text-purple-300">
          <Wrench className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          Agent Portal
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
        {role}
      </span>
    )
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
          <p className="text-xs text-gray-400 hidden sm:block">Logged in as {user.name}</p>
        </div>
      </div>

      {/* Right: Role Switcher + Dark/Light Toggle + User Menu */}
      <div className="flex items-center gap-3">
        {/* Active Role Badge */}
        <div className="hidden sm:block">
          {getRoleBadge()}
        </div>

        {/* Role Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setSwitcherOpen(!switcherOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 transition"
          >
            <span className="hidden md:inline text-gray-400">Switch View:</span>
            <span className="font-semibold capitalize text-blue-600 dark:text-blue-400">{user.role}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {switcherOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl py-2 z-50 text-xs animate-in fade-in-50 slide-in-from-top-2 duration-150">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Switch Role / Persona
              </div>

              {/* Admin option */}
              <button
                onClick={() => {
                  switchRole('admin')
                  setSwitcherOpen(false)
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  role === 'admin' ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="font-medium">Administrator</p>
                  <p className="text-[10px] text-gray-400">Company-wide control & users</p>
                </div>
              </button>

              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

              {/* Landlord 1 option */}
              <button
                onClick={() => {
                  switchLandlord(1, 'Chief Adebayo (Landlord 1)')
                  setSwitcherOpen(false)
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  role === 'landlord' && user.landlordId === 1 ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-600 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <Building2 className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="font-medium">Chief Adebayo (Landlord 1)</p>
                  <p className="text-[10px] text-gray-400">3 Properties • Victoria Island</p>
                </div>
              </button>

              {/* Landlord 2 option */}
              <button
                onClick={() => {
                  switchLandlord(2, 'Alhaji Musa (Landlord 2)')
                  setSwitcherOpen(false)
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  role === 'landlord' && user.landlordId === 2 ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-600 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <Building2 className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="font-medium">Alhaji Musa (Landlord 2)</p>
                  <p className="text-[10px] text-gray-400">3 Properties • Abuja</p>
                </div>
              </button>

              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

              {/* Agent 1 option */}
              <button
                onClick={() => {
                  switchAgent(1, 'Sarah Jenkins (Senior Agent)')
                  setSwitcherOpen(false)
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  role === 'agent' && user.agentId === 1 ? 'bg-purple-50/70 dark:bg-purple-950/40 text-purple-600 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <Wrench className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="font-medium">Sarah Jenkins (Agent 1)</p>
                  <p className="text-[10px] text-gray-400">Assigned Properties & Maintenance</p>
                </div>
              </button>

              {/* Agent 2 option */}
              <button
                onClick={() => {
                  switchAgent(2, 'Michael Okon (Field Agent)')
                  setSwitcherOpen(false)
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  role === 'agent' && user.agentId === 2 ? 'bg-purple-50/70 dark:bg-purple-950/40 text-purple-600 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <Wrench className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="font-medium">Michael Okon (Agent 2)</p>
                  <p className="text-[10px] text-gray-400">Assigned Properties & Repairs</p>
                </div>
              </button>
            </div>
          )}
        </div>

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

        {/* User avatar and sign out */}
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
            role === 'admin' ? 'bg-blue-600' : role === 'landlord' ? 'bg-emerald-600' : 'bg-purple-600'
          }`}>
            {user.name.charAt(0)}
          </div>
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
