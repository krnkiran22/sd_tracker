'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, User, KeyRound, ArrowRight, Loader2, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { storeAuth } from '@/lib/auth'
import { apiUrl } from '@/lib/api'

type Step = 'details' | 'otp' | 'done'

const ROLES = [
  { value: 'logistics', label: 'Logistics',     desc: 'Receive SD cards and log packets' },
  { value: 'ingestion', label: 'Ingestion Team', desc: 'Acknowledge and process SD card ingestion' },
]

export default function SignupPage() {
  const router = useRouter()

  const [step, setStep]   = useState<Step>('details')
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole]   = useState('')
  const [otp, setOtp]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [info, setInfo]       = useState('')

  // ── Step 1: submit name + email + role ─────────────────────────────────────
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim())  { setError('Name is required.'); return }
    if (!email.trim()) { setError('Email is required.'); return }
    if (!role)         { setError('Please select a role.'); return }

    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), role }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Signup failed.'); return }
      setInfo(data.message || 'Verification code sent!')
      setStep('otp')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: verify OTP ─────────────────────────────────────────────────────
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
      setStep('done')
      setTimeout(() => router.replace('/'), 1500)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resendOtp = async () => {
    setError(''); setLoading(true)
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

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-foreground rounded-xl mb-4">
            <span className="text-background text-lg font-bold">B</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Build AI Tracker</h1>
          <p className="text-xs text-muted-foreground mt-1">Create your account</p>
        </div>

        <Card className="gap-0 py-0">
          <CardContent className="py-6 px-6">

            {/* ── STEP: Details ──────────────────────────────────────────── */}
            {step === 'details' && (
              <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-4">
                <div>
                  <h2 className="text-sm font-semibold mb-1">Create account</h2>
                  <p className="text-xs text-muted-foreground">
                    Sign up to access the SD card tracking system.
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label className="text-label block mb-1">Full name *</label>
                  <div className="relative">
                    <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your full name"
                      className="pl-8"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-label block mb-1">Email address *</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="pl-8"
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="text-label block mb-2">Select your role *</label>
                  <div className="flex flex-col gap-2">
                    {ROLES.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`w-full text-left px-3 py-2.5 border rounded transition-colors ${
                          role === r.value
                            ? 'border-foreground bg-muted'
                            : 'border-border hover:border-muted-foreground'
                        }`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-colors ${
                            role === r.value ? 'border-foreground bg-foreground' : 'border-muted-foreground'
                          }`} />
                          <div>
                            <div className="text-xs font-semibold">{r.label}</div>
                            <div className="text-[10px] text-muted-foreground">{r.desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-[10px] text-destructive">{error}</p>}

                <Button type="submit" disabled={loading} className="w-full gap-2">
                  {loading ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                  {loading ? 'Sending code…' : 'Continue'}
                </Button>

                <p className="text-center text-[10px] text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="text-foreground font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            )}

            {/* ── STEP: OTP ───────────────────────────────────────────────── */}
            {step === 'otp' && (
              <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
                <div>
                  <h2 className="text-sm font-semibold mb-1">Verify your email</h2>
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
                  {loading ? 'Verifying…' : 'Verify & Create Account'}
                </Button>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <button type="button"
                    onClick={() => { setStep('details'); setOtp(''); setError('') }}
                    className="hover:text-foreground hover:underline">
                    ← Change details
                  </button>
                  <button type="button" onClick={resendOtp} disabled={loading}
                    className="hover:text-foreground hover:underline disabled:opacity-50">
                    Resend code
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP: Done ──────────────────────────────────────────────── */}
            {step === 'done' && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={28} className="text-green-600" />
                </div>
                <div className="text-center">
                  <h2 className="text-sm font-semibold">Account created!</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Welcome, {name}. Redirecting you to the dashboard…
                  </p>
                </div>
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              </div>
            )}

          </CardContent>
        </Card>

      </div>
    </div>
  )
}
