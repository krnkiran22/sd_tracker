import ReadyToIngestContent, { type ReadyPacket } from '@/components/ReadyToIngestContent'

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

async function getReadyPackets(): Promise<ReadyPacket[]> {
  try {
    const res = await fetch(
      `${BACKEND}/api/packets?statuses=counted_and_repacked,collected_for_ingestion`,
      { cache: 'no-store' }
    )
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default async function ReadyToIngestPage() {
  const initialPackets = await getReadyPackets()
  return <ReadyToIngestContent initialPackets={initialPackets} />
}
