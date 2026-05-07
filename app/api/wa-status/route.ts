import { NextResponse } from 'next/server'

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

export async function GET() {
  try {
    const [statusRes, qrRes] = await Promise.all([
      fetch(`${BACKEND}/wa-status`, { cache: 'no-store', signal: AbortSignal.timeout(8000) }),
      fetch(`${BACKEND}/qr-json`,   { cache: 'no-store', signal: AbortSignal.timeout(8000) }),
    ])

    const status = statusRes.ok ? await statusRes.json() : { ready: false, qr_pending: false }
    const qrData = qrRes.ok    ? await qrRes.json()   : { ready: false, qr: null }

    return NextResponse.json({
      ready:      status.ready   ?? qrData.ready ?? false,
      qr_pending: status.qr_pending ?? !!qrData.qr,
      message:    status.message ?? '',
      qr:         qrData.qr ?? null,
    })
  } catch (err) {
    return NextResponse.json(
      { ready: false, qr_pending: false, message: 'Backend unreachable', qr: null, error: String(err) },
      { status: 502 },
    )
  }
}
