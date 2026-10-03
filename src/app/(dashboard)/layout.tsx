import { AppShell } from '@/components/layout/app-shell'
import { SessionProvider } from 'next-auth/react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  )
}
