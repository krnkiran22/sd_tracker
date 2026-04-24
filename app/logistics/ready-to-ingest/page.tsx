'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  CheckCircle2, Clock, Loader2, RefreshCw, Search, X,
  Package2, Boxes, Factory, CalendarDays, User, Inbox,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiUrl } from '@/lib/api'

interface ReadyPacket {
  id: number
  team_name: string
  factory: string
  date_received: string
  sd_card_count: number
  num_packages: number
  deployment_date: string | null
  status: 'counted_and_repacked' | 'collected_for_ingestion'
  counted_by: string | null
  collected_by: string | null
  entered_by: string
  created_at: string
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ── Collect confirmation modal ─────────────────────────────────────────────────
function CollectModal({
  packet,
  onClose,
  onSuccess,
}: {
  packet: ReadyPacket
  onClose: () => void
  onSuccess: () => void
}) {
  const [collectedBy, setCollectedBy] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  const handleCollect = async () => {
    if (!collectedBy.trim()) { setError('Enter the name of the person collecting.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(apiUrl(`/api/packets/${packet.id}/events`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'collected_for_ingestion',
          event_data: { collected_by: collectedBy.trim() },
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4">
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-sm overflow-hidden">
        <div className="flex items-start justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-sm font-bold flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-green-600" />
              Mark as Collected
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground">{packet.team_name}</span>
              {' '}· {packet.num_packages} pkg · {packet.sd_card_count} cards
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1.5">
              <User size={11} /> Collected By <span className="text-destructive">*</span>
            </label>
            <Input
              autoFocus
              value={collectedBy}
              onChange={e => setCollectedBy(e.target.value)}
              placeholder="Name of person collecting"
              className="h-11"
              onKeyDown={e => e.key === 'Enter' && handleCollect()}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Ingestion team member picking up this packet.
            </p>
          </div>

          {error && (
            <p className="text-[11px] text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pb-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11">
              Cancel
            </Button>
            <Button
              onClick={handleCollect}
              disabled={loading}
              className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 text-white h-11"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              {loading ? 'Saving…' : 'Confirm Collection'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Packet card ────────────────────────────────────────────────────────────────
function PacketCard({
  packet,
  onCollect,
}: {
  packet: ReadyPacket
  onCollect: (p: ReadyPacket) => void
}) {
  const isCollected = packet.status === 'collected_for_ingestion'

  return (
    <Card className={`overflow-hidden transition-all ${isCollected ? 'opacity-70' : ''}`}>
      <CardContent className="p-0">
        {/* Status strip */}
        <div className={`h-1 ${isCollected ? 'bg-green-500' : 'bg-blue-500'}`} />

        <div className="p-4 flex flex-col gap-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{packet.team_name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Received {fmtDate(packet.date_received)}
                {packet.entered_by && ` · by ${packet.entered_by}`}
              </p>
            </div>
            {isCollected ? (
              <Badge className="bg-green-100 text-green-700 border-green-200 shrink-0 text-[10px]">
                <CheckCircle2 size={10} className="mr-1" /> Collected
              </Badge>
            ) : (
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 shrink-0 text-[10px]">
                <Clock size={10} className="mr-1" /> Ready to Ingest
              </Badge>
            )}
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Package2 size={11} />
              <span>
                <span className="font-semibold text-foreground">{packet.sd_card_count}</span> SD cards
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Boxes size={11} />
              <span>
                <span className="font-semibold text-foreground">{packet.num_packages}</span> packages
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Factory size={11} />
              <span className="truncate">
                {packet.factory || '—'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays size={11} />
              <span>{fmtDate(packet.deployment_date)}</span>
            </div>
          </div>

          {/* Counted by / Collected by */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            {packet.counted_by && (
              <span className="bg-muted rounded-full px-2.5 py-0.5 text-muted-foreground flex items-center gap-1">
                <User size={10} /> Counted by <span className="font-medium text-foreground">{packet.counted_by}</span>
              </span>
            )}
            {isCollected && packet.collected_by && (
              <span className="bg-green-50 text-green-700 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                <CheckCircle2 size={10} /> Collected by <span className="font-medium">{packet.collected_by}</span>
              </span>
            )}
          </div>

          {/* Action */}
          {!isCollected && (
            <Button
              size="sm"
              onClick={() => onCollect(packet)}
              className="bg-green-600 hover:bg-green-700 text-white h-9 text-xs gap-1.5 mt-1"
            >
              <CheckCircle2 size={12} /> Mark as Collected
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReadyToIngestPage() {
  const [packets, setPackets]               = useState<ReadyPacket[]>([])
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState('')
  const [filterStatus, setFilterStatus]     = useState<'all' | 'ready' | 'collected'>('all')
  const [collectTarget, setCollectTarget]   = useState<ReadyPacket | null>(null)

  const loadPackets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        apiUrl('/api/packets?statuses=counted_and_repacked,collected_for_ingestion'),
        { cache: 'no-store' }
      )
      const d = await res.json()
      if (Array.isArray(d)) setPackets(d)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadPackets() }, [loadPackets])

  const displayed = packets
    .filter(p => {
      if (filterStatus === 'ready')     return p.status === 'counted_and_repacked'
      if (filterStatus === 'collected') return p.status === 'collected_for_ingestion'
      return true
    })
    .filter(p => !search || p.team_name.toLowerCase().includes(search.toLowerCase()) ||
                 (p.factory || '').toLowerCase().includes(search.toLowerCase()))

  const readyCount     = packets.filter(p => p.status === 'counted_and_repacked').length
  const collectedCount = packets.filter(p => p.status === 'collected_for_ingestion').length

  return (
    <div className="flex flex-col gap-5 max-w-3xl">

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Inbox size={16} className="text-blue-600 shrink-0" />
        <span className="text-sm font-semibold">Ready to Ingest</span>
        <div className="flex gap-1.5 flex-wrap">
          {readyCount > 0 && (
            <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 text-[10px]">
              {readyCount} awaiting
            </Badge>
          )}
          {collectedCount > 0 && (
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-[10px]">
              {collectedCount} collected
            </Badge>
          )}
        </div>
        <button
          onClick={loadPackets}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Refresh"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search team or factory…"
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

        {/* Status filter tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 self-start">
          {(['all', 'ready', 'collected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize min-h-[34px] ${
                filterStatus === tab
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'ready' ? 'Not Collected' : tab === 'all' ? 'All' : 'Collected'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-12 justify-center">
          <Loader2 size={14} className="animate-spin" /> Loading packets…
        </div>
      ) : packets.length === 0 ? (
        <div className="text-center py-16">
          <Inbox size={40} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No packets yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Packets appear here once they have been counted and repacked in the Pending page.
          </p>
        </div>
      ) : displayed.length === 0 ? (
        <p className="text-xs text-muted-foreground py-8 text-center">
          No packets match your current filter.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayed.map(p => (
            <PacketCard key={p.id} packet={p} onCollect={setCollectTarget} />
          ))}
        </div>
      )}

      {/* ── Collect modal ─────────────────────────────────────────────── */}
      {collectTarget && (
        <CollectModal
          packet={collectTarget}
          onClose={() => setCollectTarget(null)}
          onSuccess={loadPackets}
        />
      )}
    </div>
  )
}
