import InventoryPageContent from '@/components/InventoryPageContent'
import type { Transaction } from '@/lib/items'

async function getTransactions(): Promise<Transaction[]> {
  try {
    const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')
    const res = await fetch(`${base}/api/transactions`, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default async function LogisticsInventoryPage() {
  const initialRecords = await getTransactions()
  return <InventoryPageContent initialRecords={initialRecords} />
}
