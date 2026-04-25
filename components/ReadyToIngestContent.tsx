'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  CheckCircle2, Clock, Loader2, RefreshCw, Search, X,
  Package2, Boxes, Factory, CalendarDays, User, Inbox, ImageIcon,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiUrl } from '@/lib/api'

export interface ReadyPacket {
  id: number
  team_name: string
  factory: string
  factory_entries: string | null
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

interface FactoryEntry { factory_name: string; deployment_date: string | null; count?: number }

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function parsePhotos(raw: string | null): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

function parseFactoryEntries(packet: ReadyPacket): FactoryEntry[] {
  if (packet.factory_entries) {
    try { return JSON.parse(packet.factory_entries) } catch { /* fall through */ }
  }
  return [{ factory_name: packet.factory || '—', deployment_date: packet.deployment_date ?? null }]
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
        src={src} alt="Repack photo"
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

// ── Packet card ────────────────────────────────────────────────────────────────
function PacketCard({ packet }: { packet: ReadyPacket }) {
  const isCollected = packet.status === 'collected_for_ingestion'
  const photos      = parsePhotos(packet.repack_photo_urls)
  const factories   = parseFactoryEntries(packet)
  const [lightbox, setLightbox] = useState<string | null>(null)

  return (
    <>
      <Card className={`overflow-hidden transition-all ${isCollected ? 'opacity-75' : ''}`}>
        <CardContent className="p-0">
          <div className={`h-1.5 ${isCollected ? 'bg-green-500' : 'bg-blue-500'}`} />

          <div className="p-4 flex flex-col gap-3">

            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{packet.team_name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Received {fmtDate(packet.date_received)}
                  {packet.entered_by && ` · by ${packet.entered_by}`}
                </p>
              </div>
              {isCollected ? (
                <Badge className="bg-green-100 text-green-700 border-green-200 shrink-0 text-[10px] gap-1">
                  <CheckCircle2 size={10} /> Collected
                </Badge>
              ) : (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 shrink-0 text-[10px] gap-1">
                  <Clock size={10} /> Not Collected Yet
                </Badge>
              )}
            </div>

            {/* Factory / Deployment Date entries */}
            <div className="flex flex-col gap-1 bg-muted/40 rounded-lg p-3">
              {factories.map((f, idx) => (
                <div key={idx} className={`flex flex-col gap-0.5 ${idx > 0 ? 'pt-1.5 border-t border-border/50' : ''}`}>
                  <div className="flex items-center gap-2 text-[12px]">
                    <Factory size={12} className="text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Factory{factories.length > 1 ? ` ${idx + 1}` : ''}:</span>
                    <span className="font-semibold text-foreground truncate">{f.factory_name || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] pl-5">
                    <CalendarDays size={12} className="text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Deployment:</span>
                    <span className="font-semibold text-foreground">{fmtDate(f.deployment_date)}</span>
                  </div>
                  {f.count != null && f.count > 0 && (
                    <div className="flex items-center gap-2 text-[12px] pl-5">
                      <Package2 size={12} className="text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">SD Cards:</span>
                      <span className="font-semibold text-foreground">{f.count}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Count summary */}
            <div className="flex gap-3 text-[11px]">
              <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/60 rounded-md px-2.5 py-1">
                <Package2 size={11} />
                <span className="font-semibold text-foreground">{packet.sd_card_count}</span> SD cards
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/60 rounded-md px-2.5 py-1">
                <Boxes size={11} />
                <span className="font-semibold text-foreground">{packet.num_packages}</span> packages
              </div>
            </div>

            {/* Images */}
            {photos.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <ImageIcon size={10} /> Packed Photos ({photos.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {photos.map((url, idx) => (
                    <button
                      key={idx} type="button"
                      onClick={() => setLightbox(url)}
                      className="w-16 h-16 rounded-md overflow-hidden border border-border hover:border-primary transition-colors shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Repack photo ${idx + 1}`} className="w-full h-full object-cover" />
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

            {/* Status notice */}
            {!isCollected && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-1">
                <Clock size={12} /> Awaiting collection by ingestion lead
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {lightbox && <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </>
  )
}

// ── Page content ───────────────────────────────────────────────────────────────
export default function ReadyToIngestContent({ initialPackets }: { initialPackets: ReadyPacket[] }) {
  const [packets, setPackets]           = useState<ReadyPacket[]>(initialPackets)
  const [loading, setLoading]           = useState(initialPackets.length === 0)
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'collected'>('all')

  const loadPackets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        apiUrl('/api/packets?statuses=counted_and_repacked,collected_for_ingestion&repack_photos=1'),
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
    .filter(p =>
      !search ||
      p.team_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.factory || '').toLowerCase().includes(search.toLowerCase())
    )

  const readyCount     = packets.filter(p => p.status === 'counted_and_repacked').length
  const collectedCount = packets.filter(p => p.status === 'collected_for_ingestion').length

  return (
    <div className="flex flex-col gap-5 max-w-3xl">

      {/* Page header */}
      <div className="flex items-center gap-2 flex-wrap">
        <Inbox size={16} className="text-blue-600 shrink-0" />
        <span className="text-sm font-semibold">Ready to Ingest</span>
        <div className="flex gap-1.5 flex-wrap">
          {readyCount > 0 && (
            <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 text-[10px]">
              {readyCount} not collected
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

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search team or factory…"
            className="h-10 pl-8 text-sm w-full"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
              <X size={12} />
            </button>
          )}
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1 self-start shrink-0">
          {(['all', 'ready', 'collected'] as const).map(tab => (
            <button
              key={tab} onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors min-h-[34px] ${
                filterStatus === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'ready' ? 'Not Collected' : 'Collected'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-12 justify-center">
          <Loader2 size={14} className="animate-spin" /> Loading packets…
        </div>
      ) : packets.length === 0 ? (
        <div className="text-center py-16">
          <Inbox size={40} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No packets yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Packets appear here once they have been counted and repacked.
          </p>
        </div>
      ) : displayed.length === 0 ? (
        <p className="text-xs text-muted-foreground py-8 text-center">No packets match your current filter.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayed.map(p => <PacketCard key={p.id} packet={p} />)}
        </div>
      )}
    </div>
  )
}
