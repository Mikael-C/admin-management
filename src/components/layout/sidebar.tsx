'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCheck,
  CreditCard,
  Receipt,
  Wrench,
  ShieldCheck,
  UserCog,
  X,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/auth-context'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { role, user } = useAuth()

  // Dynamic nav items based on role
  const getNavItems = () => {
    if (role === 'landlord') {
      return [
        { href: '/landlord', label: 'Landlord Dashboard', icon: LayoutDashboard },
        { href: '/properties', label: 'My Properties', icon: Building2 },
        { href: '/rents', label: 'Rent Payments', icon: CreditCard },
        { href: '/expenses', label: 'Property Expenses', icon: Receipt },
        { href: '/maintenance', label: 'Repairs & Requests', icon: Wrench },
      ]
    }

    if (role === 'agent') {
      return [
        { href: '/agent', label: 'Agent Dashboard', icon: LayoutDashboard },
        { href: '/properties', label: 'Assigned Properties', icon: Building2 },
        { href: '/maintenance', label: 'Maintenance Requests', icon: Wrench },
        { href: '/tenants', label: 'Tenant Occupancy', icon: UserCheck },
      ]
    }

    // Default: Admin
    return [
      { href: '/dashboard', label: 'Company Overview', icon: LayoutDashboard },
      { href: '/landlords', label: 'Landlords', icon: Users },
      { href: '/properties', label: 'Properties', icon: Building2 },
      { href: '/tenants', label: 'Tenants', icon: UserCheck },
      { href: '/rents', label: 'Rents & Revenue', icon: CreditCard },
      { href: '/expenses', label: 'Expenses', icon: Receipt },
      { href: '/maintenance', label: 'Maintenance & Repairs', icon: Wrench },
      { href: '/users', label: 'User & Role Access', icon: UserCog },
    ]
  }

  const navItems = getNavItems()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo & Portal Identity */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-sm',
              role === 'admin' ? 'bg-blue-600' : role === 'landlord' ? 'bg-emerald-600' : 'bg-purple-600'
            )}>
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">EstatePro</p>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 capitalize">
                {role === 'admin' ? 'Super Admin' : `${role} Portal`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current user card */}
        <div className="px-3 pt-4 pb-2">
          <div className={cn(
            'p-3 rounded-xl border text-xs',
            role === 'admin'
              ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40 text-blue-900 dark:text-blue-200'
              : role === 'landlord'
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
              : 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/60 dark:border-purple-900/40 text-purple-900 dark:text-purple-200'
          )}>
            <p className="font-semibold truncate">{user.name}</p>
            <p className="text-[10px] opacity-75 capitalize mt-0.5">Role: {role}</p>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-3">
          <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-gray-400">
            Navigation
          </div>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all',
                      isActive
                        ? role === 'landlord'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : role === 'agent'
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    )}
                  >
                    <Icon className={cn(
                      'h-4 w-4',
                      isActive
                        ? role === 'landlord'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : role === 'agent'
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-blue-600 dark:text-blue-400'
                        : ''
                    )} />
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <div className={cn(
                        'ml-auto h-1.5 w-1.5 rounded-full',
                        role === 'landlord' ? 'bg-emerald-600' : role === 'agent' ? 'bg-purple-600' : 'bg-blue-600'
                      )} />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Quick Portal Switcher links for easy preview */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-gray-400">
              Role Portals
            </div>
            <div className="space-y-1 mt-1">
              <Link
                href="/dashboard"
                onClick={onClose}
                className={cn(
                  'flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition',
                  pathname === '/dashboard' && 'font-semibold text-blue-600 dark:text-blue-400'
                )}
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  Admin Dashboard
                </span>
                <span className="text-[10px] text-gray-400">Overview</span>
              </Link>
              <Link
                href="/landlord"
                onClick={onClose}
                className={cn(
                  'flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition',
                  pathname === '/landlord' && 'font-semibold text-emerald-600 dark:text-emerald-400'
                )}
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                  Landlord Dashboard
                </span>
                <span className="text-[10px] text-gray-400">Owner</span>
              </Link>
              <Link
                href="/agent"
                onClick={onClose}
                className={cn(
                  'flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition',
                  pathname === '/agent' && 'font-semibold text-purple-600 dark:text-purple-400'
                )}
              >
                <span className="flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-purple-500" />
                  Agent Dashboard
                </span>
                <span className="text-[10px] text-gray-400">Field</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3">
          <p className="text-[11px] text-gray-400 text-center">
            EstatePro Multi-Role System © {new Date().getFullYear()}
          </p>
        </div>
      </aside>
    </>
  )
}
