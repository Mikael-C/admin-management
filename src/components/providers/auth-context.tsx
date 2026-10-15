'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export type UserRole = 'admin' | 'landlord' | 'agent' | 'tenant'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  landlordId?: number
  agentId?: number
  avatar?: string
}

export const PRESET_USERS: Record<string, AuthUser> = {
  admin: {
    id: 'usr-admin',
    name: 'System Admin',
    email: 'admin@realestate.com',
    role: 'admin',
  },
  landlord: {
    id: 'usr-landlord-1',
    name: 'Chief Adebayo (Landlord)',
    email: 'landlord1@example.com',
    role: 'landlord',
    landlordId: 1,
  },
  landlord2: {
    id: 'usr-landlord-2',
    name: 'Alhaji Musa (Landlord 2)',
    email: 'landlord2@example.com',
    role: 'landlord',
    landlordId: 2,
  },
  agent: {
    id: 'usr-agent-1',
    name: 'Sarah Jenkins (Senior Agent)',
    email: 'agent1@example.com',
    role: 'agent',
    agentId: 1,
  },
  agent2: {
    id: 'usr-agent-2',
    name: 'Michael Okon (Field Agent)',
    email: 'agent2@example.com',
    role: 'agent',
    agentId: 2,
  },
}

interface AuthContextType {
  user: AuthUser
  role: UserRole
  loginAs: (role: UserRole, targetId?: number) => void
  loginWithEmail: (email: string) => boolean
  switchRole: (role: UserRole) => void
  switchLandlord: (landlordId: number, name?: string) => void
  switchAgent: (agentId: number, name?: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'real_estate_admin_auth_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(PRESET_USERS.admin)
  const router = useRouter()
  const pathname = usePathname()

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setUser(JSON.parse(saved))
      }
    } catch {
      // ignore
    }
  }, [])

  const saveUser = (newUser: AuthUser) => {
    setUser(newUser)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
    } catch {
      // ignore
    }
  }

  const loginAs = (role: UserRole, targetId?: number) => {
    let selected = PRESET_USERS.admin
    if (role === 'landlord') {
      selected = targetId === 2 ? PRESET_USERS.landlord2 : PRESET_USERS.landlord
    } else if (role === 'agent') {
      selected = targetId === 2 ? PRESET_USERS.agent2 : PRESET_USERS.agent
    }
    saveUser(selected)

    // Redirect to relevant dashboard
    if (role === 'landlord') {
      router.push('/landlord')
    } else if (role === 'agent') {
      router.push('/agent')
    } else {
      router.push('/dashboard')
    }
  }

  const loginWithEmail = (email: string): boolean => {
    const lower = email.toLowerCase()
    let matched: AuthUser = PRESET_USERS.admin

    if (lower.includes('landlord') || lower.includes('owner')) {
      matched = PRESET_USERS.landlord
    } else if (lower.includes('agent')) {
      matched = PRESET_USERS.agent
    }

    saveUser(matched)
    if (matched.role === 'landlord') {
      router.push('/landlord')
    } else if (matched.role === 'agent') {
      router.push('/agent')
    } else {
      router.push('/dashboard')
    }
    return true
  }

  const switchRole = (newRole: UserRole) => {
    loginAs(newRole)
  }

  const switchLandlord = (landlordId: number, name?: string) => {
    const updated: AuthUser = {
      ...user,
      role: 'landlord',
      landlordId,
      name: name || `Landlord #${landlordId}`,
    }
    saveUser(updated)
  }

  const switchAgent = (agentId: number, name?: string) => {
    const updated: AuthUser = {
      ...user,
      role: 'agent',
      agentId,
      name: name || `Agent #${agentId}`,
    }
    saveUser(updated)
  }

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    setUser(PRESET_USERS.admin)
    router.push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user.role,
        loginAs,
        loginWithEmail,
        switchRole,
        switchLandlord,
        switchAgent,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
