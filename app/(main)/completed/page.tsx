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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CompletedPage() {
  const [packets, setPackets]       = useState<SdPacket[]>([])
  const [ingestions, setIngestions] = useState<Record<number, IngestionRecord>>({})
  const [loading, setLoading]       = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [search, setSearch]         = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/packets?status=completed'), { cache: 'no-store' })
      const data: SdPacket[] = await res.json()
      if (Array.isArray(data)) {
        setPackets(data)
        const records: Record<number, IngestionRecord> = {}
        await Promise.all(
          data.map(async p => {
            const r = await fetch(apiUrl(`/api/packets/${p.id}`), { cache: 'no-store' }).then(x => x.json())
            if (r.ingestion) records[p.id] = r.ingestion
          })
        )
        setIngestions(records)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filtered = useMemo(() =>
    search
      ? packets.filter(p => p.team_name.toLowerCase().includes(search.toLowerCase()))
      : packets
  , [packets, search])

  return (
    <div className="flex flex-col gap-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-center gap-2">
        <CheckCircle size={16} className="text-green-600" />
        <span className="text-sm font-semibold">Completed</span>
        {!loading && packets.length > 0 && (
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-[10px]">
            {filtered.length}{search ? ` / ${packets.length}` : ''}
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
      {packets.length > 0 && (
        <div className="relative w-full sm:max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search team…"
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
          <Loader2 size={14} className="animate-spin" /> Loading…
        </div>
      ) : packets.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Inbox size={36} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No completed ingestions yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="gap-0 py-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left bg-muted/30">
                  {['', '#', 'Team', 'Factory', 'Rcvd Date', 'Submitted', 'Actual', 'Missing', 'Extra', 'Red', 'Industry', 'Ingested By', 'Deploy Date'].map(h => (
                    <th key={h} className="px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const rec        = ingestions[p.id]
                  const isExpanded = expandedId === p.id
                  return [
                    <tr
                      key={p.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    >
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{p.id}</td>
                      <td className="px-3 py-2.5 font-medium whitespace-nowrap">{p.team_name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{p.factory || '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{formatDate(p.date_received)}</td>
                      <td className="px-3 py-2.5 tabular-nums">{p.sd_card_count}</td>
                      <td className="px-3 py-2.5 tabular-nums font-semibold text-green-700">{rec?.actual_count ?? '—'}</td>
                      <td className={`px-3 py-2.5 tabular-nums font-semibold ${rec && rec.missing_count > 0 ? 'text-red-600' : ''}`}>
                        {rec?.missing_count ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">{rec?.extra_count ?? '—'}</td>
                      <td className={`px-3 py-2.5 tabular-nums font-semibold ${rec && rec.red_cards_count > 0 ? 'text-red-600' : ''}`}>
                        {rec?.red_cards_count ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{rec?.industry ?? '—'}</td>
                      <td className="px-3 py-2.5">{rec?.ingested_by ?? '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{rec ? formatDate(rec.deployment_date) : '—'}</td>
                    </tr>,
                    isExpanded && rec && (
                      <tr key={`${p.id}-detail`} className="bg-green-50/40 border-b border-border">
                        <td colSpan={13} className="px-6 py-3">
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px]">
                            <span><strong>Notes:</strong> {rec.notes || 'None'}</span>
                            <span><strong>POC Emails:</strong> {p.poc_emails || 'None'}</span>
                            <span><strong>Logged By:</strong> {p.entered_by}</span>
                            <span><strong>Completed At:</strong> {new Date(rec.created_at).toLocaleString('en-IN')}</span>
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
