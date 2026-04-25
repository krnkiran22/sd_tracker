'use client'

import { useState, useCallback, useEffect } from 'react'
import { ScrollText, RefreshCw, Package2, CheckCircle2, Inbox, ShieldAlert, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { apiUrl } from '@/lib/api'
import { useAuth } from '@/components/AuthProvider'

export interface EventRow {
  id: number
  packet_id: number
  event_type: string
  event_data: Record<string, unknown>
  created_at: string
  team_name: string
}

const ALLOWED_ROLES = ['admin', 'ingestion_lead', 'logistics_lead']

function getEventIcon(type: string) {
  switch (type) {
    case 'received_at_hq':        return <Package2 size={14} className="text-blue-500 shrink-0" />
    case 'counted_and_repacked':  return <CheckCircle2 size={14} className="text-amber-500 shrink-0" />
    case 'collected_for_ingestion': return <Inbox size={14} className="text-teal-500 shrink-0" />
    default: return <ScrollText size={14} className="text-gray-400 shrink-0" />
  }
}

function getEventLabel(type: string): string {
  switch (type) {
    case 'received_at_hq':          return 'Received'
    case 'counted_and_repacked':    return 'Counted & Repacked'
    case 'collected_for_ingestion': return 'Collected'
    default: return type
  }
}

function getEventBadgeColor(type: string): string {
  switch (type) {
    case 'received_at_hq':          return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'counted_and_repacked':    return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'collected_for_ingestion': return 'bg-teal-50 text-teal-700 border-teal-200'
    default: return 'bg-gray-50 text-gray-600 border-gray-200'
  }
}

function buildDescription(event: EventRow): string {
  const d = event.event_data
  switch (event.event_type) {
    case 'received_at_hq': {
      const by = (d.entered_by as string) || 'Someone'
      return `${by} received this packet (${event.team_name})`
    }
    case 'counted_and_repacked': {
      const by = (d.counted_by as string) || 'Someone'
      const cards = d.sd_card_count ? `${d.sd_card_count} SD cards` : ''
      const pkgs  = d.num_packages   ? `${d.num_packages} pkg` : ''
      const detail = [cards, pkgs].filter(Boolean).join(', ')
      return `${by} counted & repacked ${event.team_name}${detail ? ` — ${detail}` : ''}`
    }
    case 'collected_for_ingestion': {
      const by       = (d.collected_by as string) || 'Someone'
      const assigned = d.assigned_to ? ` and assigned it to ${d.assigned_to}` : ''
      return `${by} collected ${event.team_name}${assigned}`
    }
    default:
      return `Event on ${event.team_name}`
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

interface Props {
  initialEvents: EventRow[]
}

export default function LogsContent({ initialEvents }: Props) {
  const { user } = useAuth()
  const [events, setEvents]     = useState<EventRow[]>(initialEvents)
  const [loading, setLoading]   = useState(initialEvents.length === 0)
  const [search, setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const canView = user && ALLOWED_ROLES.includes(user.role)

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true)
      const res  = await fetch(apiUrl('/api/events?limit=300'), { cache: 'no-store' })
      if (!res.ok) throw new Error(await res.text())
      const data: EventRow[] = await res.json()
      setEvents(data)
    } catch (err) {
      console.error('Failed to load events:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <ShieldAlert size={28} />
        <p className="text-sm">You don't have permission to view logs.</p>
      </div>
    )
  }

  const eventTypes = ['all', 'received_at_hq', 'counted_and_repacked', 'collected_for_ingestion']

  const filtered = events.filter(e => {
    if (typeFilter !== 'all' && e.event_type !== typeFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const desc = buildDescription(e).toLowerCase()
      if (!desc.includes(q) && !e.team_name.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div className="flex flex-col gap-5 max-w-3xl">

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <ScrollText size={16} className="text-muted-foreground shrink-0" />
        <h1 className="text-base font-semibold">Activity Logs</h1>
        <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
          {filtered.length} events
        </Badge>
        <Button
          variant="ghost" size="sm"
          className="ml-auto h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={loadEvents}
          disabled={loading}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search logs…"
            className="h-8 pl-8 text-xs"
          />
          {search && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch('')}
            >
              <X size={12} />
            </button>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          {eventTypes.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`text-[10px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                typeFilter === t
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card text-muted-foreground border-border hover:border-foreground/40'
              }`}
            >
              {t === 'all' ? 'All' : getEventLabel(t)}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex flex-col gap-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <div className="w-4 h-4 rounded-full bg-muted-foreground/20 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="h-3 w-64 rounded bg-muted-foreground/20" />
                <div className="h-2.5 w-32 rounded bg-muted-foreground/10" />
              </div>
              <div className="w-24 h-5 rounded-full bg-muted-foreground/10 shrink-0" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <ScrollText size={24} />
          <p className="text-sm">{search || typeFilter !== 'all' ? 'No logs match your filter.' : 'No activity logs yet.'}</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Relative timeline line */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-px bg-border" />

            <div className="flex flex-col gap-0">
              {filtered.map((event, idx) => (
                <div key={event.id} className={`relative flex items-start gap-3 px-0 py-3 ${idx !== 0 ? '' : ''}`}>
                  {/* Dot */}
                  <div className="shrink-0 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-card border border-border shadow-sm">
                    {getEventIcon(event.event_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 bg-card border border-border rounded-xl px-3.5 py-3 shadow-sm">
                    <div className="flex flex-wrap items-start gap-2 justify-between">
                      <p className="text-[13px] font-medium leading-snug text-foreground">
                        {buildDescription(event)}
                      </p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${getEventBadgeColor(event.event_type)}`}>
                        {getEventLabel(event.event_type)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Packet #{event.packet_id} · {formatTime(event.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
