import ProcessingQueueContent from '@/components/ProcessingQueueContent'
import type { SdPacket } from '@/lib/types'

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

async function getQueuePackets(): Promise<SdPacket[]> {
  try {
    const res = await fetch(
      `${BACKEND}/api/packets?statuses=collected_for_ingestion,processing`,
      { cache: 'no-store', signal: AbortSignal.timeout(3000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default async function ProcessingQueuePage() {
  const initialPackets = await getQueuePackets()
  return <ProcessingQueueContent initialPackets={initialPackets} />
}
