import CollectSdcContent, { type ReadyPacket } from '@/components/CollectSdcContent'

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

async function getCollectPackets(): Promise<ReadyPacket[]> {
  try {
    const res = await fetch(
      `${BACKEND}/api/packets?statuses=counted_and_repacked,collected_for_ingestion`,
      { cache: 'no-store', signal: AbortSignal.timeout(4000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default async function CollectSdcPage() {
  const initialPackets = await getCollectPackets()
  return <CollectSdcContent initialPackets={initialPackets} />
}
