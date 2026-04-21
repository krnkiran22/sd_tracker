'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { USERS, storeAuth } from '@/lib/auth'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      const match = USERS.find(
        u => u.email === email.trim().toLowerCase() && u.password === password
      )
      if (match) {
        storeAuth({ email: match.email, role: match.role, name: match.name })
        router.replace('/')
      } else {
        setError('Invalid email or password.')
        setLoading(false)
      }
    }, 400)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-xs font-semibold tracking-tight mb-1">SD Card Tracker</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Sign in to continue</div>
        </div>

        <form onSubmit={handleLogin} className="border border-border bg-card p-6 flex flex-col gap-4">
          <div>
            <label className="text-label block mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="text-label block mb-1">Password</label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="text-[10px] text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  )
}
