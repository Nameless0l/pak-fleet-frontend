'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/types'
import { authService } from '@/services/auth.service'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  isChief: () => boolean
  isTechnician: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = Cookies.get('token')
    if (token) {
      authService.getUser()
        .then(setUser)
        .catch(() => {
          Cookies.remove('token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (credentials: { email: string; password: string }) => {
    const user = await authService.login(credentials)
    setUser(user)
    router.push('/dashboard')
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
    router.push('/login')
  }

  const isChief = () => user?.role === 'chief'
  const isTechnician = () => user?.role === 'technician'

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isChief, isTechnician }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}