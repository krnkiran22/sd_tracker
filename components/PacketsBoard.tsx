'use client'

import { useCallback, useEffect, useState } from 'react'
import { Package, Clock, CheckCircle, Loader2, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SdPacket, PacketStatus } from '@/lib/types'
import { apiUrl } from '@/lib/api'

const STATUS_CONFIG: Record<PacketStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  received:   { label: 'Received',   color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',   icon: <Package size={12} /> },
  processing: { label: 'Processing', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     icon: <Loader2 size={12} className="animate-spin" /> },
  completed:  { label: 'Completed',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   icon: <CheckCircle size={12} /> },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface PacketsBoardProps {
  refreshTrigger?: number
}

export default function PacketsBoard({ refreshTrigger }: PacketsBoardProps) {
  const [packets, setPackets]   = useState<SdPacket[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<PacketStatus | 'all'>('all')

  const fetchPackets = useCallback(async () => {
    setLoading(true)
    try {
      const url = filter !== 'all' ? apiUrl(`/api/packets?status=${filter}`) : apiUrl('/api/packets')
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()
      if (Array.isArray(data)) setPackets(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { fetchPackets() }, [fetchPackets, refreshTrigger])

  const counts = {
    all:        packets.length,
    received:   packets.filter(p => p.status === 'received').length,
    processing: packets.filter(p => p.status === 'processing').length,
    completed:  packets.filter(p => p.status === 'completed').length,
  }

  const visible = filter === 'all' ? packets : packets.filter(p => p.status === filter)

  return (
    <Card className="gap-0 py-0">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">SD Card Packets</span>
          <Badge variant="outline">{packets.length} total</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={fetchPackets} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <RefreshCw size={11} />
          </button>
          {(['all', 'received', 'processing', 'completed'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded transition-colors ${
                filter === s ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'
              }`}>
              {s === 'all' ? `All (${counts.all})` : `${s} (${counts[s]})`}
            </button>
          ))}
        </div>
      </div>

      <CardContent className="py-3">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
            <Loader2 size={12} className="animate-spin" /> Loading packets…
          </div>
        ) : visible.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No packets found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  {['#', 'Team', 'Factory', 'Date Received', 'SD Cards', 'Entered By', 'POC Emails', 'Photo', 'Status'].map(h => (
                    <th key={h} className="pb-2 pr-4 font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map(p => {
                  const cfg = STATUS_CONFIG[p.status]
                  return (
                    <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2 pr-4 font-mono text-muted-foreground">{p.id}</td>
                      <td className="py-2 pr-4 font-medium">{p.team_name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{p.factory}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{formatDate(p.date_received)}</td>
                      <td className="py-2 pr-4 font-semibold tabular-nums">{p.sd_card_count}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{p.entered_by}</td>
                      <td className="py-2 pr-4 max-w-[180px]">
                        <span className="text-muted-foreground truncate block" title={p.poc_emails}>
                          {p.poc_emails || '—'}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        {p.photo_url ? (
                          <img src={p.photo_url} alt="pkg"
                            className="h-8 w-8 object-cover border border-border rounded cursor-pointer"
                            onClick={() => window.open(p.photo_url!, '_blank')}
                            title="Click to view full photo" />
                        ) : (
                          <span className="text-muted-foreground text-[10px]">—</span>
                        )}
                      </td>
                      <td className="py-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold border rounded-full ${cfg.color} ${cfg.bg}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
