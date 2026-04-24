'use client'

import { useCallback, useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Search, X } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import TransactionForm from '@/components/TransactionForm'
import TeamCard from '@/components/TeamCard'
import RecordsTable from '@/components/RecordsTable'
import { SentReturnedByTeam } from '@/components/charts/SentReturnedByTeam'
import { CirculationTimeline } from '@/components/charts/CirculationTimeline'
import type { Transaction } from '@/lib/items'
import { ITEMS } from '@/lib/items'
import { apiUrl } from '@/lib/api'

interface TeamSummary { team: string; sent: number; returned: number }

function buildTeamSummaries(records: Transaction[]): TeamSummary[] {
  const map: Record<string, TeamSummary> = {}
  for (const r of records) {
    if (!map[r.team_name]) map[r.team_name] = { team: r.team_name, sent: 0, returned: 0 }
    const total = ITEMS.reduce((s, i) => s + ((r as any)[i.key] || 0), 0)
    if (r.type === 'sent') map[r.team_name].sent += total
    else map[r.team_name].returned += total
  }
  return Object.values(map).sort((a, b) => a.team.localeCompare(b.team))
}

function buildTeamTransactions(records: Transaction[]): Record<string, Transaction[]> {
  const map: Record<string, Transaction[]> = {}
  for (const r of records) {
    if (!map[r.team_name]) map[r.team_name] = []
    map[r.team_name].push(r)
  }
  return map
}

function buildItemTotals(records: Transaction[]) {
  return ITEMS.map(item => {
    const sent     = records.filter(r => r.type === 'sent').reduce((s, r) => s + ((r as any)[item.key] || 0), 0)
    const received = records.filter(r => r.type === 'received').reduce((s, r) => s + ((r as any)[item.key] || 0), 0)
    return { ...item, sent, received, outstanding: Math.max(0, sent - received) }
  }).filter(i => i.sent > 0 || i.received > 0)
}

function KpiCard({ label, value, sub, trend }: {
  label: string; value: string | number; sub?: string; trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <Card className="gap-0 py-0 animate-fade-in">
      <CardContent className="py-5 flex flex-col gap-1.5">
        <span className="text-label">{label}</span>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-semibold tabular-nums leading-none">{value}</span>
          {trend && (
            <span className={`mb-1 ${trend === 'up' ? 'text-amber-500' : trend === 'down' ? 'text-green-600' : 'text-muted-foreground'}`}>
              {trend === 'up' ? <TrendingUp size={16} /> : trend === 'down' ? <TrendingDown size={16} /> : <Minus size={16} />}
            </span>
          )}
        </div>
        {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <div className="h-full flex items-end gap-1 px-2">
      {[40, 70, 55, 90, 65, 80, 45].map((h, i) => (
        <div key={i} className="flex-1 bg-muted animate-pulse" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

export default function InventoryPageContent({ initialRecords }: { initialRecords?: Transaction[] }) {
  const [records, setRecords]       = useState<Transaction[]>(initialRecords ?? [])
  const [loading, setLoading]       = useState(!initialRecords)
  const [teamSearch, setTeamSearch] = useState('')
  const { user } = useAuth()

  const isAdmin     = user?.role === 'admin'
  const isLogistics = user?.role === 'logistics'
  const canEdit     = isAdmin
  const canDelete   = isAdmin

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/transactions'), { cache: 'no-store' })
      const data = await res.json()
      if (Array.isArray(data)) setRecords(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  // Only fetch client-side if no server-provided initial data
  useEffect(() => {
    if (!initialRecords) fetchRecords()
  }, [fetchRecords, initialRecords])

  const summaries     = buildTeamSummaries(records)
  const teamTxMap     = buildTeamTransactions(records)
  const itemTotals    = buildItemTotals(records)
  const totalSent     = summaries.reduce((s, t) => s + t.sent, 0)
  const totalReturned = summaries.reduce((s, t) => s + t.returned, 0)
  const totalOut      = Math.max(0, totalSent - totalReturned)
  const teamsCleared  = summaries.filter(s => s.sent > 0 && s.sent <= s.returned).length
  const teamsPending  = summaries.filter(s => s.sent > s.returned).length

  const chartRecords = records.map(r => ({
    Team:     r.team_name,
    Date:     String(r.date).slice(0, 10),
    Sent:     r.type === 'sent'     ? ITEMS.reduce((s, i) => s + ((r as any)[i.key] || 0), 0) : 0,
    Returned: r.type === 'received' ? ITEMS.reduce((s, i) => s + ((r as any)[i.key] || 0), 0) : 0,
  }))

  // Filter team cards by search
  const filteredSummaries = teamSearch.trim()
    ? summaries.filter(s => s.team.toLowerCase().includes(teamSearch.toLowerCase()))
    : summaries

  return (
    <div className="flex flex-col gap-8">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-base font-semibold">Equipment Inventory</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Track sent &amp; received equipment across all teams</p>
        </div>
        <Badge variant="outline" className="ml-auto text-[10px]">{records.length} transactions</Badge>
      </div>

      {/* ── Transaction form (admin + logistics) ────────────────────────────── */}
      {(isAdmin || isLogistics) && (
        <TransactionForm onSuccess={fetchRecords} />
      )}

      {/* ── KPI Row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard label="Total Sent"     value={totalSent} />
        <KpiCard label="Total Received" value={totalReturned} />
        <KpiCard label="Outstanding"    value={totalOut} trend={totalOut > 0 ? 'up' : 'neutral'} />
        <KpiCard label="Teams Cleared"  value={teamsCleared} trend="down" sub="fully returned" />
        <KpiCard label="Teams Pending"  value={teamsPending} trend={teamsPending > 0 ? 'up' : 'neutral'} sub="have outstanding" />
      </div>

      {/* ── Per-item summary strip ───────────────────────────────────────────── */}
      {itemTotals.length > 0 && (
        <div>
          <div className="text-label mb-2">Outstanding by Item</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {itemTotals.map(item => (
              <Card key={item.key} className="gap-0 py-0 animate-fade-in">
                <CardContent className="py-4 flex flex-col gap-1.5">
                  <span className="text-label">{item.label}</span>
                  <span className="text-2xl font-semibold tabular-nums leading-none">{item.outstanding}</span>
                  <span className="text-[10px] text-muted-foreground">of {item.sent} sent</span>
                  <div className="h-1 bg-muted mt-1 overflow-hidden rounded-full">
                    <div className="h-full bg-foreground transition-all rounded-full"
                      style={{ width: `${item.sent > 0 ? Math.min(100, Math.round((item.received / item.sent) * 100)) : 0}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {item.sent > 0 ? Math.round((item.received / item.sent) * 100) : 0}% returned
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Charts ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="gap-0 py-0">
          <div className="px-5 py-4 border-b border-border">
            <span className="text-xs font-semibold">Sent vs Received — by Team</span>
          </div>
          <CardContent className="px-5 py-4">
            <div className="h-64">
              {loading ? <ChartSkeleton /> : <SentReturnedByTeam data={summaries.map(s => ({ team: s.team, sent: s.sent, returned: s.returned }))} />}
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <div className="px-5 py-4 border-b border-border">
            <span className="text-xs font-semibold">Cumulative Circulation Timeline</span>
          </div>
          <CardContent className="px-5 py-4">
            <div className="h-64">
              {loading ? <ChartSkeleton /> : <CirculationTimeline records={chartRecords} />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Team Overview ────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-semibold">Team Overview</span>
          <span className="text-[10px] text-muted-foreground">{summaries.length} teams</span>
          <div className="ml-auto relative w-48">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={teamSearch}
              onChange={e => setTeamSearch(e.target.value)}
              placeholder="Search teams…"
              className="h-7 pl-7 text-xs"
            />
            {teamSearch && (
              <button onClick={() => setTeamSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded" />)}
          </div>
        ) : filteredSummaries.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-xs text-muted-foreground">
            {teamSearch ? `No teams matching "${teamSearch}"` : 'No transactions yet. Use the form above to record one.'}
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredSummaries.map(s => (
              <TeamCard key={s.team} team={s.team} transactions={teamTxMap[s.team] || []} />
            ))}
          </div>
        )}
      </section>

      {/* ── Transaction Log ──────────────────────────────────────────────────── */}
      <Card className="gap-0 py-0">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold">Transaction Log</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">All recorded send &amp; receive events</p>
          </div>
          <Badge variant="outline">{records.length} entries</Badge>
        </div>
        <CardContent className="py-0 px-0">
          <RecordsTable
            records={records}
            onEdited={fetchRecords}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </CardContent>
      </Card>

    </div>
  )
}
