'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import {
  Package, Loader2, CheckCircle, Clock, RefreshCw,
  ChevronDown, ChevronUp, AlertCircle, Search, X,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import IngestionForm from '@/components/IngestionForm'
import type { SdPacket, IngestionRecord } from '@/lib/types'
import { apiUrl } from '@/lib/api'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function IngestionDashboard() {
  const [packets, setPackets]       = useState<SdPacket[]>([])
  const [ingestions, setIngestions] = useState<Record<number, IngestionRecord>>({})
  const [loading, setLoading]       = useState(true)
  const [activeForm, setActiveForm] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [acknowledging, setAcknowledging] = useState<number | null>(null)
  const [ackSuccess, setAckSuccess] = useState<number | null>(null)
  const [completedSearch, setCompletedSearch] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/packets'), { cache: 'no-store' })
      const data: SdPacket[] = await res.json()
      if (Array.isArray(data)) {
        setPackets(data)
        // Fetch ingestion records for completed packets
        const completed = data.filter(p => p.status === 'completed')
        const records: Record<number, IngestionRecord> = {}
        await Promise.all(
          completed.map(async p => {
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

  const handleAcknowledge = async (packet: SdPacket) => {
    setAcknowledging(packet.id)
    try {
      const res = await fetch(apiUrl(`/api/packets/${packet.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledge' }),
      })
      if (!res.ok) throw new Error('Failed')
      setAckSuccess(packet.id)
      setTimeout(() => setAckSuccess(null), 3000)
      await fetchAll()
    } catch (e) { console.error(e) }
    finally { setAcknowledging(null) }
  }

  const received   = packets.filter(p => p.status === 'received')
  const processing = packets.filter(p => p.status === 'processing')
  const completed  = packets.filter(p => p.status === 'completed')
  const filteredCompleted = useMemo(() =>
    completedSearch
      ? completed.filter(p => p.team_name.toLowerCase().includes(completedSearch.toLowerCase()))
      : completed
  , [completed, completedSearch])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-8">
        <Loader2 size={14} className="animate-spin" /> Loading ingestion queue…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Awaiting Acknowledgement', count: received.length,   color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
          { label: 'In Processing Queue',       count: processing.length, color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
          { label: 'Completed',                 count: completed.length,  color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
        ].map(({ label, count, color, bg }) => (
          <Card key={label} className={`gap-0 py-0 border ${bg}`}>
            <CardContent className="py-4 flex flex-col gap-1">
              <span className="text-label text-[10px]">{label}</span>
              <span className={`text-2xl font-semibold tabular-nums ${color}`}>{count}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── RECEIVED — Awaiting acknowledgement ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={13} className="text-amber-600" />
          <span className="text-xs font-semibold">Awaiting Acknowledgement</span>
          {received.length > 0 && (
            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
              {received.length}
            </Badge>
          )}
          <button onClick={fetchAll} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw size={11} />
          </button>
        </div>

        {received.length === 0 ? (
          <Card><CardContent className="py-5 text-center text-xs text-muted-foreground">
            No packets awaiting acknowledgement.
          </CardContent></Card>
        ) : (
          <div className="flex flex-col gap-2">
            {received.map(p => (
              <Card key={p.id} className="gap-0 py-0 border-amber-200/70 bg-amber-50/30">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{p.team_name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">#{p.id}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-muted-foreground">
                        <span>Factory: <strong className="text-foreground">{p.factory}</strong></span>
                        <span>Received: <strong className="text-foreground">{formatDate(p.date_received)}</strong></span>
                        <span>SD Cards: <strong className="text-foreground text-base">{p.sd_card_count}</strong></span>
                        <span>By: {p.entered_by}</span>
                      </div>
                      {p.notes && (
                        <p className="text-[10px] text-muted-foreground italic mt-0.5">{p.notes}</p>
                      )}
                      {ackSuccess === p.id && (
                        <p className="text-[10px] text-green-600 font-medium mt-1">
                          ✓ Acknowledged — email sent to POCs. Packet moved to processing queue.
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAcknowledge(p)}
                      disabled={acknowledging === p.id}
                      className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white gap-1.5">
                      {acknowledging === p.id
                        ? <><Loader2 size={11} className="animate-spin" /> Acknowledging…</>
                        : <><Package size={11} /> Acknowledge</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── PROCESSING — Ready for ingestion ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Loader2 size={13} className="text-blue-600 animate-spin" />
          <span className="text-xs font-semibold">Processing Queue</span>
          {processing.length > 0 && (
            <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
              {processing.length}
            </Badge>
          )}
        </div>

        {processing.length === 0 ? (
          <Card><CardContent className="py-5 text-center text-xs text-muted-foreground">
            No packets in the processing queue.
          </CardContent></Card>
        ) : (
          <div className="flex flex-col gap-3">
            {processing.map(p => (
              <div key={p.id}>
                <Card className="gap-0 py-0 border-blue-200/70 bg-blue-50/30">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{p.team_name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">#{p.id}</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold border rounded-full text-blue-700 bg-blue-50 border-blue-200">
                            <Loader2 size={10} className="animate-spin" /> Processing
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-muted-foreground">
                          <span>Factory: <strong className="text-foreground">{p.factory}</strong></span>
                          <span>Received: <strong className="text-foreground">{formatDate(p.date_received)}</strong></span>
                          <span>SD Cards: <strong className="text-foreground text-base">{p.sd_card_count}</strong></span>
                          <span>By: {p.entered_by}</span>
                        </div>
                        {p.notes && <p className="text-[10px] text-muted-foreground italic mt-0.5">{p.notes}</p>}
                      </div>
                      {activeForm === p.id ? (
                        <Button size="sm" variant="outline" onClick={() => setActiveForm(null)} className="shrink-0">
                          Cancel
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setActiveForm(p.id)}
                          className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                          <CheckCircle size={11} /> Complete Ingestion
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {activeForm === p.id && (
                  <div className="mt-2">
                    <IngestionForm
                      packet={p}
                      onSuccess={() => { setActiveForm(null); fetchAll() }}
                      onCancel={() => setActiveForm(null)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── COMPLETED ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={13} className="text-green-600" />
          <span className="text-xs font-semibold">Completed</span>
          {completed.length > 0 && (
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
              {filteredCompleted.length} / {completed.length}
            </Badge>
          )}
        </div>

        {completed.length === 0 ? (
          <Card><CardContent className="py-5 text-center text-xs text-muted-foreground">
            No completed ingestions yet.
          </CardContent></Card>
        ) : (
          <Card className="gap-0 py-0">
            {/* Search bar */}
            <div className="px-4 py-2.5 border-b border-border">
              <div className="relative max-w-xs">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input value={completedSearch} onChange={e => setCompletedSearch(e.target.value)}
                  placeholder="Search team…"
                  className="h-7 pl-8 pr-8 text-xs w-full border border-input bg-background rounded focus:outline-none focus:ring-1 focus:ring-ring" />
                {completedSearch && (
                  <button onClick={() => setCompletedSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left bg-muted/30">
                    {['', '#', 'Team', 'Factory', 'Rcvd Date', 'Submitted', 'Actual', 'Missing', 'Extra', 'Red', 'Industry', 'Ingested By', 'Deploy Date'].map(h => (
                      <th key={h} className="px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCompleted.map(p => {
                    const rec = ingestions[p.id]
                    const isExpanded = expandedId === p.id
                    return [
                      <tr key={p.id}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                        <td className="px-3 py-2 text-muted-foreground">
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">{p.id}</td>
                        <td className="px-3 py-2 font-medium">{p.team_name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{p.factory}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{formatDate(p.date_received)}</td>
                        <td className="px-3 py-2 tabular-nums">{p.sd_card_count}</td>
                        <td className="px-3 py-2 tabular-nums font-semibold text-green-700">{rec?.actual_count ?? '—'}</td>
                        <td className={`px-3 py-2 tabular-nums font-semibold ${rec && rec.missing_count > 0 ? 'text-red-600' : ''}`}>
                          {rec?.missing_count ?? '—'}
                        </td>
                        <td className="px-3 py-2 tabular-nums">{rec?.extra_count ?? '—'}</td>
                        <td className={`px-3 py-2 tabular-nums font-semibold ${rec && rec.red_cards_count > 0 ? 'text-red-600' : ''}`}>
                          {rec?.red_cards_count ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{rec?.industry ?? '—'}</td>
                        <td className="px-3 py-2">{rec?.ingested_by ?? '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{rec ? formatDate(rec.deployment_date) : '—'}</td>
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
      </section>

    </div>
  )
}
