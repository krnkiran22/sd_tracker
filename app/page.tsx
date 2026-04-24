'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, TrendingUp, TrendingDown, Minus, LogOut } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import TransactionForm from '@/components/TransactionForm'
import TeamCard from '@/components/TeamCard'
import RecordsTable from '@/components/RecordsTable'
import PacketForm from '@/components/PacketForm'
import PacketsBoard from '@/components/PacketsBoard'
import LogisticsDashboard from '@/components/LogisticsDashboard'
import IngestionDashboard from '@/components/IngestionDashboard'
import AdminPanel from '@/components/AdminPanel'
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
      <CardContent className="py-4 flex flex-col gap-1">
        <span className="text-label">{label}</span>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-semibold tabular-nums leading-none">{value}</span>
          {trend && (
            <span className={`mb-0.5 ${trend === 'up' ? 'text-[var(--chart-4)]' : trend === 'down' ? 'text-[var(--chart-2)]' : 'text-muted-foreground'}`}>
              {trend === 'up' ? <TrendingUp size={14} /> : trend === 'down' ? <TrendingDown size={14} /> : <Minus size={14} />}
            </span>
          )}
        </div>
        {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const [records, setRecords] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [packetRefresh, setPacketRefresh] = useState(0)
  const { user, logout } = useAuth()
  const isAdmin     = user?.role === 'admin'
  const isLogistics = user?.role === 'logistics'
  const isIngestion = user?.role === 'ingestion'
  const canAdd      = isAdmin || isLogistics
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

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const summaries      = buildTeamSummaries(records)
  const teamTxMap      = buildTeamTransactions(records)
  const itemTotals     = buildItemTotals(records)
  const totalSent      = summaries.reduce((s, t) => s + t.sent, 0)
  const totalReturned  = summaries.reduce((s, t) => s + t.returned, 0)
  const totalOut       = Math.max(0, totalSent - totalReturned)
  const teamsCleared   = summaries.filter(s => s.sent > 0 && s.sent <= s.returned).length
  const teamsPending   = summaries.filter(s => s.sent > s.returned).length

  // Adapt records for the existing chart components
  const chartRecords = records.map(r => ({
    Team:     r.team_name,
    Date:     String(r.date).slice(0, 10),
    Sent:     r.type === 'sent'     ? ITEMS.reduce((s, i) => s + ((r as any)[i.key] || 0), 0) : 0,
    Returned: r.type === 'received' ? ITEMS.reduce((s, i) => s + ((r as any)[i.key] || 0), 0) : 0,
  }))

  // ── Role badge colours
  const roleBadge: Record<string, string> = {
    admin:     'bg-purple-100 text-purple-700 border-purple-200',
    logistics: 'bg-blue-100 text-blue-700 border-blue-200',
    ingestion: 'bg-green-100 text-green-700 border-green-200',
    user:      'bg-gray-100 text-gray-600 border-gray-200',
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Topbar */}
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-11 flex items-center gap-3">
          <span className="text-xs font-semibold tracking-tight">Build AI Tracker</span>
          <span className="text-border">|</span>
          {user && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${roleBadge[user.role] ?? ''}`}>
              {user.role}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {user && (
              <span className="text-[10px] text-muted-foreground hidden sm:inline">{user.name}</span>
            )}
            {(isAdmin || isLogistics) && (
              <Link href="/report">
                <Button variant="outline" size="xs" className="gap-1">
                  <FileText size={11} /> Reports
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="xs" className="gap-1 text-muted-foreground" onClick={logout}>
              <LogOut size={11} /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 flex flex-col gap-6">

        {/* ══════════════════════════════════════════════════
            INGESTION ROLE — full ingestion queue view
        ══════════════════════════════════════════════════ */}
        {isIngestion && !isAdmin && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Ingestion Dashboard</span>
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-[10px]">
                Ingestion Team
              </Badge>
            </div>
            <IngestionDashboard />
          </>
        )}

        {/* ══════════════════════════════════════════════════
            LOGISTICS ROLE — packet logging + status board
        ══════════════════════════════════════════════════ */}
        {isLogistics && !isAdmin && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Logistics Dashboard</span>
              <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 text-[10px]">
                Logistics
              </Badge>
            </div>

            {/* New event-based logistics flow */}
            <LogisticsDashboard />

            {/* Equipment transaction form */}
            <TransactionForm onSuccess={fetchRecords} />
          </>
        )}

        {/* ══════════════════════════════════════════════════
            ADMIN — full combined view
        ══════════════════════════════════════════════════ */}
        {isAdmin && (
          <>
            {/* Admin: packet form + board */}
            <details className="group">
              <summary className="cursor-pointer flex items-center gap-2 mb-3 list-none">
                <span className="text-xs font-semibold">SD Card Packet Logging</span>
                <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 text-[10px]">Logistics</Badge>
                <span className="text-[10px] text-muted-foreground ml-auto group-open:hidden">▸ expand</span>
                <span className="text-[10px] text-muted-foreground ml-auto hidden group-open:inline">▾ collapse</span>
              </summary>
              <div className="flex flex-col gap-4 mt-1">
                <LogisticsDashboard />
                <PacketForm onSuccess={() => setPacketRefresh(n => n + 1)} />
                <PacketsBoard refreshTrigger={packetRefresh} />
              </div>
            </details>

            <details className="group">
              <summary className="cursor-pointer flex items-center gap-2 mb-3 list-none">
                <span className="text-xs font-semibold">Ingestion Queue</span>
                <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-[10px]">Ingestion</Badge>
                <span className="text-[10px] text-muted-foreground ml-auto group-open:hidden">▸ expand</span>
                <span className="text-[10px] text-muted-foreground ml-auto hidden group-open:inline">▾ collapse</span>
              </summary>
              <IngestionDashboard />
            </details>

            {/* Admin CRUD panel */}
            <details className="group">
              <summary className="cursor-pointer flex items-center gap-2 mb-3 list-none">
                <span className="text-xs font-semibold">Admin Panel</span>
                <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50 text-[10px]">CRUD</Badge>
                <span className="text-[10px] text-muted-foreground ml-auto group-open:hidden">▸ expand</span>
                <span className="text-[10px] text-muted-foreground ml-auto hidden group-open:inline">▾ collapse</span>
              </summary>
              <AdminPanel />
            </details>
          </>
        )}

        {/* ══════════════════════════════════════════════════
            EQUIPMENT TRACKER (admin + user viewer)
        ══════════════════════════════════════════════════ */}
        {!isIngestion && (
          <>
            {/* Form (admin only here; logistics gets it above) */}
            {isAdmin && <TransactionForm onSuccess={fetchRecords} />}

            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <KpiCard label="Total Sent"      value={totalSent} />
              <KpiCard label="Total Received"  value={totalReturned} />
              <KpiCard label="Outstanding"     value={totalOut} trend={totalOut > 0 ? 'up' : 'neutral'} />
              <KpiCard label="Teams Cleared"   value={teamsCleared} trend="down" sub="fully returned" />
              <KpiCard label="Teams Pending"   value={teamsPending} trend={teamsPending > 0 ? 'up' : 'neutral'} sub="have outstanding" />
            </div>

            {/* Per-item summary strip */}
            {itemTotals.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {itemTotals.map(item => (
                  <Card key={item.key} className="gap-0 py-0 animate-fade-in">
                    <CardContent className="py-3 flex flex-col gap-1">
                      <span className="text-label">{item.label}</span>
                      <span className="text-lg font-semibold tabular-nums leading-none">{item.outstanding}</span>
                      <span className="text-[10px] text-muted-foreground">out of {item.sent} sent</span>
                      <div className="h-0.5 bg-muted mt-1 overflow-hidden">
                        <div className="h-full bg-foreground transition-all"
                          style={{ width: `${item.sent > 0 ? Math.min(100, Math.round((item.received / item.sent) * 100)) : 0}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Card className="gap-2 py-3">
                <CardContent className="px-4">
                  <div className="text-label mb-3">Sent vs Received / Team</div>
                  <div className="h-52">
                    {loading ? <ChartSkeleton /> : <SentReturnedByTeam data={summaries.map(s => ({ team: s.team, sent: s.sent, returned: s.returned }))} />}
                  </div>
                </CardContent>
              </Card>
              <Card className="gap-2 py-3">
                <CardContent className="px-4">
                  <div className="text-label mb-3">Cumulative Circulation</div>
                  <div className="h-52">
                    {loading ? <ChartSkeleton /> : <CirculationTimeline records={chartRecords} />}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Cards */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-label">Team Overview</span>
                <span className="text-border">·</span>
                <span className="text-[10px] text-muted-foreground">{summaries.length} teams</span>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted animate-pulse" />)}
                </div>
              ) : summaries.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-xs text-muted-foreground">
                  No teams yet. Use the form above to record a transaction.
                </CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {summaries.map(s => (
                    <TeamCard key={s.team} team={s.team} transactions={teamTxMap[s.team] || []} />
                  ))}
                </div>
              )}
            </section>

            {/* Transaction Log */}
            <Card className="gap-0 py-0">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-xs font-semibold">Transaction Log</span>
                <Badge variant="outline">{records.length} entries</Badge>
              </div>
              <CardContent className="py-3 max-h-80 overflow-y-auto">
                <RecordsTable records={records} onEdited={fetchRecords} canEdit={canEdit} canDelete={canDelete} />
              </CardContent>
            </Card>
          </>
        )}

      </main>

      <footer className="border-t border-border py-3 text-center text-[10px] text-muted-foreground uppercase tracking-wider">
        Build AI Tracker · SD Card Ingestion System
      </footer>
    </div>
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
