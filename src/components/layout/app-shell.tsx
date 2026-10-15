'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { usePathname } from 'next/navigation'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Company Overview',
  '/landlord': 'Landlord Dashboard',
  '/agent': 'Agent Dashboard',
  '/maintenance': 'Maintenance & Repairs',
  '/users': 'User & Role Access',
  '/landlords': 'Landlords',
  '/properties': 'Properties',
  '/tenants': 'Tenants',
  '/rents': 'Rents & Revenue',
  '/expenses': 'Expenses',
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const title =
    Object.entries(pageTitles).find(([key]) => pathname === key || pathname.startsWith(key + '/'))?.[1] ??
    'EstatePro Portal'

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden text-gray-900 dark:text-gray-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
