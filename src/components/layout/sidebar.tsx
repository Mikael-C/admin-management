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
  MessageSquare,
  DollarSign,
  User,
  BookOpen,
  Briefcase,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/auth-context'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { role, user, logout } = useAuth()

  const getNavItems = () => {
    if (role === 'landlord') {
      return [
        { href: '/landlord', label: 'My Dashboard', icon: LayoutDashboard },
        { href: '/properties', label: 'My Properties', icon: Building2 },
        { href: '/rents', label: 'Rent Payments', icon: CreditCard },
        { href: '/expenses', label: 'Property Expenses', icon: Receipt },
        { href: '/maintenance', label: 'Repairs & Requests', icon: Wrench },
        { href: '/payouts', label: 'Payout Requests', icon: DollarSign },
        { href: '/messages', label: 'Messages', icon: MessageSquare },
        { href: '/profile', label: 'My Profile', icon: User },
      ]
    }

    if (role === 'agent') {
      return [
        { href: '/agent', label: 'My Dashboard', icon: LayoutDashboard },
        { href: '/properties', label: 'Assigned Properties', icon: Building2 },
        { href: '/tenants', label: 'Tenant Occupancy', icon: UserCheck },
        { href: '/maintenance', label: 'Maintenance Requests', icon: Wrench },
        { href: '/messages', label: 'Messages', icon: MessageSquare },
        { href: '/profile', label: 'My Profile', icon: User },
      ]
    }

    // admin and super_admin
    return [
      { href: '/dashboard', label: 'Company Overview', icon: LayoutDashboard },
      { href: '/landlords', label: 'Landlords', icon: Users },
      { href: '/properties', label: 'Properties', icon: Building2 },
      { href: '/tenants', label: 'Tenants', icon: UserCheck },
      { href: '/rents', label: 'Rents & Revenue', icon: CreditCard },
      { href: '/expenses', label: 'Expenses', icon: Receipt },
      { href: '/maintenance', label: 'Maintenance & Repairs', icon: Wrench },
      { href: '/payouts', label: 'Payout Requests', icon: DollarSign },
      { href: '/messages', label: 'Messages', icon: MessageSquare },
      ...(role === 'super_admin' ? [
        { href: '/users', label: 'User & Role Access', icon: UserCog },
      ] : []),
      { href: '/ledger', label: 'Ledger', icon: BookOpen },
      { href: '/profile', label: 'My Profile', icon: User },
    ]
  }

  const navItems = getNavItems()

  const roleColor = {
    super_admin: { badge: 'bg-blue-600', card: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40 text-blue-900 dark:text-blue-200', active: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300', dot: 'bg-blue-600', icon: 'text-blue-600 dark:text-blue-400', label: 'Super Admin Portal' },
    admin: { badge: 'bg-indigo-600', card: 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200/60 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-200', active: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300', dot: 'bg-indigo-600', icon: 'text-indigo-600 dark:text-indigo-400', label: 'Admin Staff Portal' },
    landlord: { badge: 'bg-emerald-600', card: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200', active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', dot: 'bg-emerald-600', icon: 'text-emerald-600 dark:text-emerald-400', label: 'Landlord Portal' },
    agent: { badge: 'bg-purple-600', card: 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/60 dark:border-purple-900/40 text-purple-900 dark:text-purple-200', active: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300', dot: 'bg-purple-600', icon: 'text-purple-600 dark:text-purple-400', label: 'Agent Portal' },
  }

  const colors = roleColor[role as keyof typeof roleColor] || roleColor.admin

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-sm', colors.badge)}>
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">EstatePro</p>
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{colors.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User card */}
        <div className="px-3 pt-4 pb-2">
          <div className={cn('p-3 rounded-xl border text-xs', colors.card)}>
            <div className="flex items-center gap-2">
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0', colors.badge)}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{user?.name}</p>
                <p className="text-[10px] opacity-75 mt-0.5">{user?.email}</p>
                <p className="text-[10px] opacity-60 mt-0.5 uppercase tracking-wider font-medium">
                  {role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-3">
          <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-gray-400">
            Navigation
          </div>
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && item.href.length > 1 && pathname.length > item.href.length && pathname[item.href.length] === '/')
                || pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all',
                      isActive
                        ? colors.active
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive ? colors.icon : '')} />
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <div className={cn('ml-auto h-1.5 w-1.5 rounded-full', colors.dot)} />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer / Logout */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 space-y-2">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
          <p className="text-[10px] text-gray-400 text-center">
            EstatePro Management © {new Date().getFullYear()}
          </p>
        </div>
      </aside>
    </>
  )
}
