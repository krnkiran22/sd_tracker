'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Clock, Loader2, CheckCircle2, ChevronRight, X, RefreshCw, Search,
  Package2, Boxes, Factory, CalendarDays, User, Camera, ImagePlus, Trash2, Plus,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/AuthProvider'
import { apiUrl } from '@/lib/api'

export interface LogisticsPacket {
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

interface FactoryEntry {
  factory_name: string
  deployment_date: string
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
  const [factoryEntries, setFactoryEntries] = useState<FactoryEntry[]>([
    { factory_name: packet.factory || '', deployment_date: '' },
  ])
  const [conditionNotes, setConditionNotes] = useState('')
  const [countedBy,      setCountedBy]      = useState('')
  const [photoUrls,      setPhotoUrls]      = useState<string[]>([])
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')

  const photoInputRef  = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const extraCounters = user?.name && !COUNTERS.includes(user.name) ? [user.name] : []

  const addFactoryEntry = () =>
    setFactoryEntries(prev => [...prev, { factory_name: '', deployment_date: '' }])

  const removeFactoryEntry = (idx: number) =>
    setFactoryEntries(prev => prev.filter((_, i) => i !== idx))

  const updateFactoryEntry = (idx: number, key: keyof FactoryEntry, value: string) =>
    setFactoryEntries(prev => prev.map((e, i) => i === idx ? { ...e, [key]: value } : e))

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        const result = ev.target?.result as string
        if (result) setPhotoUrls(prev => [...prev, result])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removePhoto = (idx: number) =>
    setPhotoUrls(prev => prev.filter((_, i) => i !== idx))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!sdCardCount || Number(sdCardCount) <= 0) {
      setError('Enter the total SD card count.'); return
    }
    if (!numPackages || Number(numPackages) <= 0) {
      setError('Enter the number of packages.'); return
    }
    for (let i = 0; i < factoryEntries.length; i++) {
      if (!factoryEntries[i].factory_name.trim()) {
        setError(`Enter factory name for entry ${i + 1}.`); return
      }
      if (!factoryEntries[i].deployment_date) {
        setError(`Select deployment date for entry ${i + 1}.`); return
      }
    }
    if (!countedBy) { setError('Select who is counting.'); return }
    if (photoUrls.length === 0) { setError('Add at least one photo of the packed items.'); return }

    setLoading(true)
    try {
      const res = await fetch(apiUrl(`/api/packets/${packet.id}/events`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'counted_and_repacked',
          event_data: {
            sd_card_count:    Number(sdCardCount),
            num_packages:     Number(numPackages),
            factory_name:     factoryEntries[0].factory_name.trim(),
            deployment_date:  factoryEntries[0].deployment_date,
            factory_entries:  factoryEntries.map(e => ({
              factory_name:    e.factory_name.trim(),
              deployment_date: e.deployment_date,
            })),
            condition_notes:  conditionNotes.trim() || null,
            counted_by:       countedBy,
            repack_photo_urls: photoUrls,
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

        {/* Scrollable form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">

          {/* SD Card Count + Num Packages */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1.5">
                <Package2 size={11} /> Total SD Cards <span className="text-destructive">*</span>
              </label>
              <Input
                type="number" min={1} value={sdCardCount}
                onChange={e => setSdCardCount(e.target.value)}
                placeholder="e.g. 90" className="h-11 text-base" autoFocus
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1.5">
                <Boxes size={11} /> No. of Packages <span className="text-destructive">*</span>
              </label>
              <Input
                type="number" min={1} value={numPackages}
                onChange={e => setNumPackages(e.target.value)}
                placeholder="e.g. 3" className="h-11 text-base"
              />
            </div>
          </div>

          {/* Team Name (read-only) */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1.5">
              <User size={11} /> Team Name
            </label>
            <div className="h-11 border border-input bg-muted/50 rounded-md px-3 flex items-center text-sm text-muted-foreground select-none">
              {packet.team_name}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">From arrival log — read only</p>
          </div>

          {/* Dynamic factory + deployment date entries */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Factory size={11} /> Factory &amp; Deployment <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={addFactoryEntry}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                <Plus size={11} /> Add Factory
              </button>
            </div>

            {factoryEntries.map((entry, idx) => (
              <div
                key={idx}
                className="border border-border rounded-lg p-3 flex flex-col gap-2 bg-muted/20 relative"
              >
                {factoryEntries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFactoryEntry(idx)}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded"
                  >
                    <X size={13} />
                  </button>
                )}
                <p className="text-[10px] font-semibold text-muted-foreground">
                  {factoryEntries.length > 1 ? `Factory ${idx + 1}` : 'Factory'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Name</label>
                    <Input
                      type="text"
                      value={entry.factory_name}
                      onChange={e => updateFactoryEntry(idx, 'factory_name', e.target.value)}
                      placeholder="e.g. Greybeez HQ"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Deployment Date</label>
                    <input
                      type="date"
                      value={entry.deployment_date}
                      onChange={e => updateFactoryEntry(idx, 'deployment_date', e.target.value)}
                      className="w-full h-9 border border-input bg-background px-3 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
            ))}
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

          {/* Packed Images */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1.5">
              <Camera size={11} /> Packed Images <span className="text-destructive">*</span>
            </label>
            <p className="text-[10px] text-muted-foreground mb-2">
              Take photos of the packed items. Multiple images allowed.
            </p>

            {photoUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {photoUrls.map((url, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Repack photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 h-10 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:bg-muted/50 hover:border-primary transition-colors"
              >
                <Camera size={14} /> Camera
              </button>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 h-10 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:bg-muted/50 hover:border-primary transition-colors"
              >
                <ImagePlus size={14} /> Gallery
              </button>
            </div>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhotoChange} />
            <input ref={photoInputRef}  type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />
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
              type="submit" disabled={loading}
              className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 text-white h-11"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              {loading ? 'Saving…' : 'Mark as Counted & Repacked'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page content ───────────────────────────────────────────────────────────────
export default function PendingPageContent({ initialPackets }: { initialPackets: LogisticsPacket[] }) {
  const [pending, setPending]               = useState<LogisticsPacket[]>(initialPackets)
  const [loadingList, setLoadingList]       = useState(false)
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

  // Auto-refresh on mount to ensure data is current even if SSR timed out
  useEffect(() => { loadPending() }, [loadPending])

  const filteredPending = search
    ? pending.filter(p => p.team_name.toLowerCase().includes(search.toLowerCase()))
    : pending

  return (
    <div className="flex flex-col gap-4 max-w-2xl">

      {/* Page header */}
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-amber-600" />
        <span className="text-sm font-semibold">Pending Count &amp; Repack</span>
        {pending.length > 0 && (
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

      {/* Search */}
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

      {/* Pending list */}
      <Card className="py-4 gap-0 border-amber-200/60 bg-amber-50/20">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock size={14} className="text-amber-600" />
            Packets Awaiting Count &amp; Repack
            {pending.length > 0 && (
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
              <p className="text-xs text-muted-foreground mt-1">All packets have been counted and repacked.</p>
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
                      {p.entered_by && <span className="text-blue-600">by {p.entered_by}</span>}
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

      {/* Modal */}
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
