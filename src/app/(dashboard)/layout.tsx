import { AppShell } from '@/components/layout/app-shell'

// DEMO MODE: SessionProvider removed. Re-add when auth is re-enabled.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
