'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Clock, Loader2, CheckCircle2, ChevronRight, X, RefreshCw,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/AuthProvider'
import { apiUrl } from '@/lib/api'

interface LogisticsPacket {
  id: number
  team_name: string
  date_received: string
  status: string
  poc_phones: string
  created_at: string
}

function timeSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function fmtDate(d: string) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}

// ── Count & Repack modal ───────────────────────────────────────────────────────
function CountRepackModal({
  packet,
  onClose,
  onSuccess,
}: {
  packet: LogisticsPacket
  onClose: () => void
  onSuccess: () => void
}) {
  const { user } = useAuth()
  const [sdCardCount, setSdCardCount]     = useState('')
  const [conditionNotes, setConditionNotes] = useState('')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!sdCardCount || Number(sdCardCount) <= 0) {
      setError('Enter the SD card count.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(apiUrl(`/api/packets/${packet.id}/events`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'counted_and_repacked',
          event_data: {
            sd_card_count:   Number(sdCardCount),
            condition_notes: conditionNotes.trim() || null,
            counted_by:      user?.name ?? 'Logistics',
          },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-xs font-semibold">🔢 Count &amp; Repack</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {packet.team_name} · received {fmtDate(packet.date_received)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          <div>
            <label className="text-label block mb-1">SD Card Count *</label>
            <Input
              type="number"
              min={1}
              value={sdCardCount}
              onChange={e => setSdCardCount(e.target.value)}
              placeholder="e.g. 90"
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Total number of SD cards counted in this packet.
            </p>
          </div>

          <div>
            <label className="text-label block mb-1">
              Condition Notes{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={conditionNotes}
              onChange={e => setConditionNotes(e.target.value)}
              placeholder="Any notes about card condition, damaged cards, etc."
              rows={3}
              className="w-full text-sm border border-input bg-background rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {error && <p className="text-[10px] text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
            >
              {loading
                ? <Loader2 size={12} className="animate-spin" />
                : <CheckCircle2 size={12} />}
              {loading ? 'Saving…' : 'Mark as Counted & Repacked'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PendingPage() {
  const [pending, setPending]               = useState<LogisticsPacket[]>([])
  const [loadingList, setLoadingList]       = useState(true)
  const [selectedPacket, setSelectedPacket] = useState<LogisticsPacket | null>(null)

  const loadPending = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch(apiUrl('/api/packets?status=received_at_hq'), { cache: 'no-store' })
      const d = await res.json()
      if (Array.isArray(d)) setPending(d)
    } catch { /* ignore */ }
    finally { setLoadingList(false) }
  }, [])

  useEffect(() => { loadPending() }, [loadPending])

  return (
    <div className="flex flex-col gap-4 max-w-2xl">

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-amber-600" />
        <span className="text-sm font-semibold">Pending Count &amp; Repack</span>
        {!loadingList && pending.length > 0 && (
          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-[10px]">
            {pending.length}
          </Badge>
        )}
        <button
          onClick={loadPending}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh"
        >
          <RefreshCw size={11} className={loadingList ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Pending list ─────────────────────────────────────────────── */}
      <Card className="py-4 gap-0 border-amber-200/60 bg-amber-50/20">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock size={14} className="text-amber-600" />
            Packets Awaiting Count &amp; Repack
            {!loadingList && pending.length > 0 && (
              <Badge variant="outline" className="ml-1 text-amber-700 border-amber-300 bg-amber-50 text-[10px]">
                {pending.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          {loadingList ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-6">
              <Loader2 size={12} className="animate-spin" /> Loading…
            </div>
          ) : pending.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2" />
              <p className="text-sm font-medium text-green-700">All clear!</p>
              <p className="text-xs text-muted-foreground mt-1">
                All packets have been counted and repacked.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/50">
              {pending.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPacket(p)}
                  className="flex items-center gap-3 py-3.5 px-1 text-left hover:bg-amber-50/60 transition-colors rounded group"
                >
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.team_name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Received {fmtDate(p.date_received)}
                      <span className="mx-1.5 text-border">·</span>
                      <span className="text-amber-600 font-medium">{timeSince(p.created_at)}</span>
                      {p.poc_phones && (
                        <>
                          <span className="mx-1.5 text-border">·</span>
                          <span className="text-green-700">📱 {p.poc_phones}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-blue-600 group-hover:underline flex items-center gap-0.5 shrink-0">
                    Count &amp; Repack <ChevronRight size={11} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal ────────────────────────────────────────────────────── */}
      {selectedPacket && (
        <CountRepackModal
          packet={selectedPacket}
          onClose={() => setSelectedPacket(null)}
          onSuccess={loadPending}
        />
      )}
    </div>
  )
}
