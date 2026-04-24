'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Clock, Loader2, CheckCircle2, ChevronRight, X, RefreshCw, Search,
  Package2, Boxes, Factory, CalendarDays, User,
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
  factory: string
  date_received: string
  sd_card_count: number
  status: string
  poc_phones: string
  entered_by: string
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
  return d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'
}

const COUNTERS = ['Amaan', 'Naresh', 'Nathish']

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
  const [sdCardCount,    setSdCardCount]    = useState(String(packet.sd_card_count || ''))
  const [numPackages,    setNumPackages]    = useState('')
  const [factoryName,    setFactoryName]    = useState(packet.factory || '')
  const [deploymentDate, setDeploymentDate] = useState('')
  const [conditionNotes, setConditionNotes] = useState('')
  const [countedBy,      setCountedBy]      = useState('')
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')

  const extraCounters = user?.name && !COUNTERS.includes(user.name) ? [user.name] : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!sdCardCount || Number(sdCardCount) <= 0) {
      setError('Enter the total SD card count.')
      return
    }
    if (!numPackages || Number(numPackages) <= 0) {
      setError('Enter the number of packages.')
      return
    }
    if (!factoryName.trim()) {
      setError('Enter the factory name.')
      return
    }
    if (!deploymentDate) {
      setError('Select the deployment date.')
      return
    }
    if (!countedBy) {
      setError('Select who is counting.')
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
            num_packages:    Number(numPackages),
            factory_name:    factoryName.trim(),
            deployment_date: deploymentDate,
            condition_notes: conditionNotes.trim() || null,
            counted_by:      countedBy,
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4">
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[92dvh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <p className="text-sm font-bold flex items-center gap-1.5">
              <Package2 size={14} className="text-blue-600" />
              Count &amp; Repack
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground">{packet.team_name}</span>
              {' '}· received {fmtDate(packet.date_received)}
              {packet.entered_by && ` · by ${packet.entered_by}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">

          {/* Row: SD Card Count + Num Packages */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1.5">
                <Package2 size={11} /> Total SD Cards <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min={1}
                value={sdCardCount}
                onChange={e => setSdCardCount(e.target.value)}
                placeholder="e.g. 90"
                className="h-11 text-base"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1.5">
                <Boxes size={11} /> No. of Packages <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min={1}
                value={numPackages}
                onChange={e => setNumPackages(e.target.value)}
                placeholder="e.g. 3"
                className="h-11 text-base"
              />
            </div>
          </div>

          {/* Factory Name */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1.5">
              <Factory size={11} /> Factory / Team Name <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={factoryName}
              onChange={e => setFactoryName(e.target.value)}
              placeholder="e.g. Greybeez"
              className="h-11"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              The factory or team this packet belongs to — confirm it matches what was received.
            </p>
          </div>

          {/* Deployment Date */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1.5">
              <CalendarDays size={11} /> Deployment Date <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              value={deploymentDate}
              onChange={e => setDeploymentDate(e.target.value)}
              className="w-full h-11 border border-input bg-background px-3 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Who is Counting */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1.5">
              <User size={11} /> Who is Counting? <span className="text-destructive">*</span>
            </label>
            <select
              value={countedBy}
              onChange={e => setCountedBy(e.target.value)}
              className="w-full h-11 border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring rounded-md"
            >
              <option value="">— Select counter —</option>
              {[...COUNTERS, ...extraCounters].map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Condition Notes */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Condition Notes{' '}
              <span className="text-muted-foreground font-normal normal-case">(optional)</span>
            </label>
            <textarea
              value={conditionNotes}
              onChange={e => setConditionNotes(e.target.value)}
              placeholder="Any notes about card condition, damaged cards, etc."
              rows={2}
              className="w-full text-sm border border-input bg-background rounded-md px-3 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {error && (
            <p className="text-[11px] text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1 pb-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 text-white h-11"
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
  const [search, setSearch]                 = useState('')

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

  const filteredPending = search
    ? pending.filter(p => p.team_name.toLowerCase().includes(search.toLowerCase()))
    : pending

  return (
    <div className="flex flex-col gap-4 max-w-2xl">

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-amber-600" />
        <span className="text-sm font-semibold">Pending Count &amp; Repack</span>
        {!loadingList && pending.length > 0 && (
          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-[10px]">
            {filteredPending.length}{search ? ` / ${pending.length}` : ''}
          </Badge>
        )}
        <button
          onClick={loadPending}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Refresh"
        >
          <RefreshCw size={13} className={loadingList ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Search ───────────────────────────────────────────────────── */}
      {pending.length > 0 && (
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
              {filteredPending.length === 0 && (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  No packets matching &ldquo;{search}&rdquo;
                </p>
              )}
              {filteredPending.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPacket(p)}
                  className="flex items-center gap-3 py-4 px-2 text-left hover:bg-amber-50/60 active:bg-amber-100/80 transition-colors rounded group min-h-[64px]"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.team_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                      <span>Received {fmtDate(p.date_received)}</span>
                      <span className="text-amber-600 font-medium">{timeSince(p.created_at)}</span>
                      {p.entered_by && (
                        <span className="text-blue-600">by {p.entered_by}</span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 group-hover:underline flex items-center gap-0.5 shrink-0 bg-blue-50 px-2.5 py-1.5 rounded-full">
                    Count &amp; Repack <ChevronRight size={13} />
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
