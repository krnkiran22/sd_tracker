'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import {
  CheckCircle, Loader2, RefreshCw, ChevronDown, ChevronUp, Search, X, Inbox,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { SdPacket, IngestionRecord } from '@/lib/types'
import { apiUrl } from '@/lib/api'

interface CompletedRow extends SdPacket {
  ingestion: IngestionRecord | null
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CompletedPage() {
  const [rows, setRows]         = useState<CompletedRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [search, setSearch]     = useState('')

  // Single round-trip — backend JOIN query
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/packets/completed-with-records'), { cache: 'no-store' })
      if (!res.ok) { setRows([]); return }
      const data = await res.json()
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filtered = useMemo(() =>
    search
      ? rows.filter(r =>
          r.team_name.toLowerCase().includes(search.toLowerCase()) ||
          (r.factory || '').toLowerCase().includes(search.toLowerCase()) ||
          (r.ingestion?.ingested_by || '').toLowerCase().includes(search.toLowerCase())
        )
      : rows
  , [rows, search])

  return (
    <div className="flex flex-col gap-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-center gap-2">
        <CheckCircle size={16} className="text-green-600" />
        <span className="text-sm font-semibold">Completed</span>
        {!loading && rows.length > 0 && (
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-[10px]">
            {filtered.length}{search ? ` / ${rows.length}` : ''}
          </Badge>
        )}
        <button
          onClick={fetchAll}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Search */}
      {rows.length > 0 && (
        <div className="relative w-full sm:max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search team, factory, person…"
            className="h-10 pl-8 text-sm w-full"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-10 justify-center">
          <Loader2 size={14} className="animate-spin" /> Loading completed ingestions…
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Inbox size={36} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No completed ingestions yet.</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground py-8 text-center">
          No results for &ldquo;{search}&rdquo;
        </p>
      ) : (
        <Card className="gap-0 py-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left bg-muted/30">
                  {['', '#', 'Team', 'Factory', 'Rcvd', 'Deployment', 'Actual', 'Missing', 'Red', 'Ingested By', 'Completed'].map(h => (
                    <th key={h} className="px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  const rec        = row.ingestion
                  const isExpanded = expandedId === row.id
                  return [
                    <tr
                      key={row.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : row.id)}
                    >
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{row.id}</td>
                      <td className="px-3 py-2.5 font-semibold whitespace-nowrap">{row.team_name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{row.factory || '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{formatDate(row.date_received)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{formatDate(rec?.deployment_date)}</td>
                      <td className="px-3 py-2.5 tabular-nums font-semibold text-green-700">{rec?.actual_count ?? '—'}</td>
                      <td className={`px-3 py-2.5 tabular-nums font-semibold ${rec && rec.missing_count > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {rec?.missing_count ?? '—'}
                      </td>
                      <td className={`px-3 py-2.5 tabular-nums font-semibold ${rec && rec.red_cards_count > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {rec?.red_cards_count ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{rec?.ingested_by ?? '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                        {rec ? new Date(rec.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                      </td>
                    </tr>,
                    isExpanded && (
                      <tr key={`${row.id}-detail`} className="bg-green-50/40 border-b border-border">
                        <td colSpan={11} className="px-5 py-3">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-1.5 text-[11px]">
                            <span><strong className="text-foreground">Team:</strong> {row.team_name}</span>
                            <span><strong className="text-foreground">Factory:</strong> {row.factory || '—'}</span>
                            <span><strong className="text-foreground">SD Cards Submitted:</strong> {row.sd_card_count}</span>
                            <span><strong className="text-foreground">Actual Count:</strong> <span className="text-green-700 font-semibold">{rec?.actual_count ?? '—'}</span></span>
                            <span><strong className="text-foreground">Missing:</strong> <span className={rec && rec.missing_count > 0 ? 'text-red-600 font-semibold' : ''}>{rec?.missing_count ?? '—'}</span></span>
                            <span><strong className="text-foreground">Red Cards:</strong> <span className={rec && rec.red_cards_count > 0 ? 'text-red-600 font-semibold' : ''}>{rec?.red_cards_count ?? '—'}</span></span>
                            <span><strong className="text-foreground">Ingested By:</strong> {rec?.ingested_by ?? '—'}</span>
                            {row.assigned_to && <span><strong className="text-foreground">Assigned To:</strong> {row.assigned_to}</span>}
                            {row.counted_by  && <span><strong className="text-foreground">Counted By:</strong> {row.counted_by}</span>}
                            <span><strong className="text-foreground">Date Received:</strong> {formatDate(row.date_received)}</span>
                            <span><strong className="text-foreground">Deployment Date:</strong> {formatDate(rec?.deployment_date)}</span>
                            <span><strong className="text-foreground">POC:</strong> {row.poc_emails || '—'}</span>
                            {rec?.notes && (
                              <span className="col-span-full"><strong className="text-foreground">Notes:</strong> {rec.notes}</span>
                            )}
                            <span className="col-span-full text-muted-foreground">
                              <strong className="text-foreground">Completed At:</strong>{' '}
                              {rec ? new Date(rec.created_at).toLocaleString('en-IN') : '—'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ),
                  ]
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
