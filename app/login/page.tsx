'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, KeyRound, ArrowRight, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { storeAuth } from '@/lib/auth'
import { apiUrl } from '@/lib/api'

type Step = 'email' | 'otp'

export default function LoginPage() {
  const router = useRouter()

  const [step, setStep]   = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [info, setInfo]     = useState('')

  // ── Step 1: submit email ──────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Please enter your email.'); return }
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return }
      setInfo(data.message || 'OTP sent to your email.')
      setStep('otp')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: verify OTP ────────────────────────────────────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (otp.trim().length !== 6) { setError('Enter the 6-digit code.'); return }
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/auth/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid code.'); return }
      storeAuth(data.user)
      router.replace('/')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resendOtp = async () => {
    setError(''); setInfo(''); setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (res.ok) setInfo('New code sent to your email.')
      else setError(data.error || 'Failed to resend.')
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-foreground rounded-xl mb-4">
            <span className="text-background text-lg font-bold">B</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Build AI Tracker</h1>
          <p className="text-xs text-muted-foreground mt-1">SD Card Ingestion &amp; Logistics</p>
        </div>

        <Card className="gap-0 py-0">
          <CardContent className="py-6 px-6">

            {/* ── STEP: Email ─────────────────────────────────────────────── */}
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                <div>
                  <h2 className="text-sm font-semibold mb-1">Sign in</h2>
                  <p className="text-xs text-muted-foreground">
                    Enter your email to receive a one-time login code.
                  </p>
                </div>
                <div>
                  <label className="text-label block mb-1">Email address</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="pl-8"
                      autoFocus
                    />
                  </div>
                </div>
                {error && <p className="text-[10px] text-destructive">{error}</p>}
                <Button type="submit" disabled={loading} className="w-full gap-2">
                  {loading ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                  {loading ? 'Checking…' : 'Send Code'}
                </Button>
                <p className="text-center text-[10px] text-muted-foreground">
                  No account?{' '}
                  <Link href="/signup" className="text-foreground font-semibold hover:underline">
                    Sign up
                  </Link>
                </p>
              </form>
            )}

            {/* ── STEP: OTP ───────────────────────────────────────────────── */}
            {step === 'otp' && (
              <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
                <div>
                  <h2 className="text-sm font-semibold mb-1">Enter verification code</h2>
                  <p className="text-xs text-muted-foreground">
                    We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.
                  </p>
                </div>
                {info && <p className="text-[10px] text-green-600 font-medium">{info}</p>}
                <div>
                  <label className="text-label block mb-1">6-digit code</label>
                  <div className="relative">
                    <KeyRound size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="pl-8 text-center tracking-[0.5em] font-mono text-lg"
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                </div>
                {error && <p className="text-[10px] text-destructive">{error}</p>}
                <Button type="submit" disabled={loading || otp.length !== 6} className="w-full gap-2">
                  {loading ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />}
                  {loading ? 'Verifying…' : 'Verify & Sign In'}
                </Button>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <button type="button" onClick={() => { setStep('email'); setOtp(''); setError('') }}
                    className="hover:text-foreground hover:underline">
                    ← Change email
                  </button>
                  <button type="button" onClick={resendOtp} disabled={loading}
                    className="hover:text-foreground hover:underline disabled:opacity-50">
                    Resend code
                  </button>
                </div>
              </form>
            )}

          </CardContent>
        </Card>

      </div>
    </div>
  )
}
