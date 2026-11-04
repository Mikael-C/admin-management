'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authApi } from '@/lib/api-client'

export type UserRole = 'super_admin' | 'admin' | 'landlord' | 'agent'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
  phone?: string
  avatar?: string
  landlordId?: number | null
  agentId?: number | null
  adminId?: number | null
}

interface AuthContextType {
  user: AuthUser | null
  role: UserRole | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; redirectTo?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'estatepro_token'
const USER_KEY = 'estatepro_user'

// Public routes that don't require auth
const PUBLIC_ROUTES = ['/login']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Load saved session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    const savedUser = localStorage.getItem(USER_KEY)

    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user && !PUBLIC_ROUTES.includes(pathname)) {
      router.push('/login')
    }
  }, [isLoading, user, pathname, router])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await authApi.login(email, password)

      const authUser: AuthUser = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role as UserRole,
        phone: res.user.phone,
        avatar: res.user.avatar,
        landlordId: res.user.landlordId,
        agentId: res.user.agentId,
        adminId: res.user.adminId,
      }

      setToken(res.token)
      setUser(authUser)
      localStorage.setItem(TOKEN_KEY, res.token)
      localStorage.setItem(USER_KEY, JSON.stringify(authUser))

      return { success: true, redirectTo: res.redirectTo }
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed. Please try again.' }
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    router.push('/login')
  }, [router])

  const refreshUser = useCallback(async () => {
    if (!token) return
    try {
      const res = await authApi.me()
      const updated = { ...user, ...res.user } as AuthUser
      setUser(updated)
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
    } catch {
      // Token expired - logout
      logout()
    }
  }, [token, user, logout])

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
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
