// Lightweight ping to keep Railway from cold-starting.
// Called by the client on every app load. Returns immediately.
import { NextResponse } from 'next/server'

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

export async function GET() {
  try {
    // Fire-and-forget — don't wait for Railway to fully respond,
    // just send the TCP handshake so Railway starts waking up.
    fetch(`${BACKEND}/api/teams`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    }).catch(() => {})
  } catch { /* ignore */ }

  return NextResponse.json({ ok: true })
}
