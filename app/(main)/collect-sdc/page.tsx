'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, Clock, Loader2, RefreshCw, Search, X,
  Package2, Boxes, Factory, CalendarDays, User, Inbox, ImageIcon, ShieldAlert,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiUrl } from '@/lib/api'
import { useAuth } from '@/components/AuthProvider'

interface ReadyPacket {
  id: number
  team_name: string
  factory: string
  date_received: string
  sd_card_count: number
  num_packages: number
  deployment_date: string | null
  repack_photo_urls: string | null
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

function parsePhotos(raw: string | null): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

// ── Image lightbox ─────────────────────────────────────────────────────────────
function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Repack photo"
        className="max-w-[90vw] max-h-[85dvh] object-contain rounded-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  )
}

// ── Collect confirmation modal ─────────────────────────────────────────────────
function CollectModal({
  packet,
  collectorName,
  onClose,
  onSuccess,
}: {
  packet: ReadyPacket
  collectorName: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleCollect = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(apiUrl(`/api/packets/${packet.id}/events`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'collected_for_ingestion',
          event_data: { collected_by: collectorName },
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
              Confirm Collection
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground">{packet.team_name}</span>
              {' '}· {packet.num_packages} pkg · {packet.sd_card_count} SD cards
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          <div className="bg-muted/50 rounded-lg p-3 text-[12px] flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Factory size={12} className="text-muted-foreground" />
              <span className="text-muted-foreground">Factory:</span>
              <span className="font-semibold">{packet.factory || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays size={12} className="text-muted-foreground" />
              <span className="text-muted-foreground">Deployment:</span>
              <span className="font-semibold">{fmtDate(packet.deployment_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={12} className="text-muted-foreground" />
              <span className="text-muted-foreground">Collecting as:</span>
              <span className="font-semibold text-teal-700">{collectorName}</span>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            This will mark the packet as <strong>Collected</strong> and notify the logistics team.
            This action cannot be undone.
          </p>

          {error && (
            <p className="text-[11px] text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11">
              Cancel
            </Button>
            <Button
              onClick={handleCollect}
              disabled={loading}
              className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 text-white h-11"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              {loading ? 'Collecting…' : 'Collect Packet'}
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
  const photos      = parsePhotos(packet.repack_photo_urls)
  const [lightbox, setLightbox] = useState<string | null>(null)

  return (
    <>
      <Card className={`overflow-hidden transition-all ${isCollected ? 'opacity-70' : 'border-blue-200/70 shadow-sm'}`}>
        <CardContent className="p-0">
          <div className={`h-1.5 ${isCollected ? 'bg-green-500' : 'bg-teal-500'}`} />

          <div className="p-4 flex flex-col gap-3">

            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{packet.team_name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Received {fmtDate(packet.date_received)}
                  {packet.entered_by && ` · logged by ${packet.entered_by}`}
                </p>
              </div>
              {isCollected ? (
                <Badge className="bg-green-100 text-green-700 border-green-200 shrink-0 text-[10px] gap-1">
                  <CheckCircle2 size={10} /> Collected
                </Badge>
              ) : (
                <Badge className="bg-teal-50 text-teal-700 border-teal-200 shrink-0 text-[10px] gap-1">
                  <Inbox size={10} /> Ready to Collect
                </Badge>
              )}
            </div>

            {/* Key details — labelled rows */}
            <div className="flex flex-col gap-1.5 text-[12px] bg-muted/40 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Factory size={12} className="text-muted-foreground shrink-0" />
                <span className="text-muted-foreground min-w-[90px]">Factory Name:</span>
                <span className="font-semibold text-foreground">{packet.factory || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays size={12} className="text-muted-foreground shrink-0" />
                <span className="text-muted-foreground min-w-[90px]">Deployment Date:</span>
                <span className="font-semibold text-foreground">{fmtDate(packet.deployment_date)}</span>
              </div>
            </div>

            {/* Count pills */}
            <div className="flex gap-2 flex-wrap text-[11px]">
              <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/60 rounded-md px-2.5 py-1">
                <Package2 size={11} />
                <span className="font-semibold text-foreground">{packet.sd_card_count}</span> SD cards
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/60 rounded-md px-2.5 py-1">
                <Boxes size={11} />
                <span className="font-semibold text-foreground">{packet.num_packages}</span> packages
              </div>
            </div>

            {/* Packed photos */}
            {photos.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <ImageIcon size={10} /> Packed Photos ({photos.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {photos.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLightbox(url)}
                      className="w-16 h-16 rounded-md overflow-hidden border border-border hover:border-primary transition-colors shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Who counted / collected */}
            <div className="flex flex-wrap gap-2 text-[11px]">
              {packet.counted_by && (
                <span className="bg-muted rounded-full px-2.5 py-0.5 text-muted-foreground flex items-center gap-1">
                  <User size={10} /> Counted by{' '}
                  <span className="font-medium text-foreground">{packet.counted_by}</span>
                </span>
              )}
              {isCollected && packet.collected_by && (
                <span className="bg-green-50 text-green-700 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Collected by{' '}
                  <span className="font-medium">{packet.collected_by}</span>
                </span>
              )}
            </div>

            {/* Collect action */}
            {!isCollected && (
              <Button
                size="sm"
                onClick={() => onCollect(packet)}
                className="bg-teal-600 hover:bg-teal-700 text-white h-9 text-xs gap-1.5 mt-1"
              >
                <CheckCircle2 size={12} /> Collect this Packet
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {lightbox && <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CollectSdcPage() {
  const { user }                            = useAuth()
  const router                              = useRouter()
  const [packets, setPackets]               = useState<ReadyPacket[]>([])
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState('')
  const [filterStatus, setFilterStatus]     = useState<'all' | 'ready' | 'collected'>('all')
  const [collectTarget, setCollectTarget]   = useState<ReadyPacket | null>(null)

  // Gate: only ingestion_lead and admin
  useEffect(() => {
    if (user && user.role !== 'ingestion_lead' && user.role !== 'admin') {
      router.replace('/')
    }
  }, [user, router])

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

  if (!user || (user.role !== 'ingestion_lead' && user.role !== 'admin')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <ShieldAlert size={40} className="text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Access restricted</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          This page is only available to Ingestion Leads.
        </p>
      </div>
    )
  }

  const displayed = packets
    .filter(p => {
      if (filterStatus === 'ready')     return p.status === 'counted_and_repacked'
      if (filterStatus === 'collected') return p.status === 'collected_for_ingestion'
      return true
    })
    .filter(p =>
      !search ||
      p.team_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.factory || '').toLowerCase().includes(search.toLowerCase())
    )

  const readyCount     = packets.filter(p => p.status === 'counted_and_repacked').length
  const collectedCount = packets.filter(p => p.status === 'collected_for_ingestion').length

  return (
    <div className="flex flex-col gap-5 max-w-3xl">

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Inbox size={16} className="text-teal-600 shrink-0" />
        <div className="min-w-0">
          <span className="text-sm font-semibold">Collecting</span>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            SD card packets ready to be collected from the logistics team
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap ml-auto">
          {readyCount > 0 && (
            <Badge variant="outline" className="text-teal-700 border-teal-300 bg-teal-50 text-[10px]">
              {readyCount} to collect
            </Badge>
          )}
          {collectedCount > 0 && (
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-[10px]">
              {collectedCount} collected
            </Badge>
          )}
          <button
            onClick={loadPackets}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Logged in as pill */}
      <div className="flex items-center gap-2 text-[11px] bg-teal-50 border border-teal-200 rounded-lg px-3 py-2 self-start">
        <User size={12} className="text-teal-700" />
        <span className="text-teal-800">
          Collecting as <span className="font-bold">{user.name}</span>
          <span className="text-teal-600 ml-1">({user.email})</span>
        </span>
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

        <div className="flex gap-1 bg-muted rounded-lg p-1 self-start shrink-0">
          {(['all', 'ready', 'collected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors min-h-[34px] ${
                filterStatus === tab
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'ready' ? 'To Collect' : 'Collected'}
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
          <p className="text-sm font-medium text-muted-foreground">No packets ready yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Packets appear here once the logistics team has counted and repacked them.
          </p>
        </div>
      ) : displayed.length === 0 ? (
        <p className="text-xs text-muted-foreground py-8 text-center">
          No packets match your filter.
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
          collectorName={user.name}
          onClose={() => setCollectTarget(null)}
          onSuccess={loadPackets}
        />
      )}
    </div>
  )
}
