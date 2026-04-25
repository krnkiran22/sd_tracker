import LogArrivalContent, { type TeamInfo, type LogisticsPacket } from '@/components/LogArrivalContent'

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

async function fetchInitialData(): Promise<{ teams: TeamInfo[]; packets: LogisticsPacket[] }> {
  try {
    const [teamsRes, packetsRes] = await Promise.all([
      fetch(`${BACKEND}/api/teams`,   { cache: 'no-store', signal: AbortSignal.timeout(4000) }),
      fetch(`${BACKEND}/api/packets`, { cache: 'no-store', signal: AbortSignal.timeout(4000) }),
    ])
    const teams   = teamsRes.ok   ? await teamsRes.json()   : []
    const packets = packetsRes.ok ? await packetsRes.json() : []
    return {
      teams:   Array.isArray(teams)   ? teams   : [],
      packets: Array.isArray(packets) ? packets : [],
    }
  } catch {
    return { teams: [], packets: [] }
  }
}

export default async function LogArrivalPage() {
  const { teams, packets } = await fetchInitialData()
  return <LogArrivalContent initialTeams={teams} initialPackets={packets} />
}
