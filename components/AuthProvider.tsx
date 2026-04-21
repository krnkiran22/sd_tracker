'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getStoredAuth, clearAuth } from '@/lib/auth'
import type { AuthUser } from '@/lib/auth'

interface AuthCtx { user: AuthUser | null; logout: () => void }
const Ctx = createContext<AuthCtx>({ user: null, logout: () => {} })

export function useAuth() { return useContext(Ctx) }

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]   = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/login' || pathname === '/signup') { setReady(true); return }
    const stored = getStoredAuth()
    if (!stored) {
      router.replace('/login')
    } else {
      setUser(stored)
      setReady(true)
    }
  }, [pathname, router])

  const logout = () => {
    clearAuth()
    setUser(null)
    router.replace('/login')
  }

  if (!ready) return null
  return <Ctx.Provider value={{ user, logout }}>{children}</Ctx.Provider>
}
