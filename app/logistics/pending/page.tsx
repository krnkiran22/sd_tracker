import PendingPageContent, { type LogisticsPacket } from '@/components/PendingPageContent'

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

async function getPendingPackets(): Promise<LogisticsPacket[]> {
  try {
    const res = await fetch(`${BACKEND}/api/packets?status=received_at_hq`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default async function PendingPage() {
  const initialPackets = await getPendingPackets()
  return <PendingPageContent initialPackets={initialPackets} />
}
