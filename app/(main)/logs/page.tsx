import LogsContent, { type EventRow } from '@/components/LogsContent'

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

async function fetchInitialEvents(): Promise<EventRow[]> {
  try {
    const res = await fetch(`${BACKEND}/api/events?limit=300`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function LogsPage() {
  const initialEvents = await fetchInitialEvents()
  return <LogsContent initialEvents={initialEvents} />
}
