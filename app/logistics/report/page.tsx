import ReportPageContent from '@/components/ReportPageContent'
import type { Transaction } from '@/lib/items'

async function getInitialData(): Promise<{ records: Transaction[]; teams: string[] }> {
  try {
    const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')
    const [txRes, teamsRes] = await Promise.all([
      fetch(`${base}/api/transactions`, { cache: 'no-store' }),
      fetch(`${base}/api/teams`, { cache: 'no-store' }),
    ])
    const records: Transaction[] = txRes.ok ? await txRes.json() : []
    const teams: string[]        = teamsRes.ok ? await teamsRes.json() : []
    return {
      records: Array.isArray(records) ? records : [],
      teams:   Array.isArray(teams)   ? teams   : [],
    }
  } catch {
    return { records: [], teams: [] }
  }
}

export default async function LogisticsReportPage() {
  const { records, teams } = await getInitialData()
  return <ReportPageContent initialRecords={records} initialTeams={teams} />
}
