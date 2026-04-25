'use client'

import { useCallback, useState } from 'react'
import {
  Loader2, CheckCircle, RefreshCw, Package, Factory,
  CalendarDays, User, UserCheck, Package2, Boxes, FileText,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import IngestionForm from '@/components/IngestionForm'
import type { SdPacket } from '@/lib/types'
import { apiUrl } from '@/lib/api'

interface FactoryEntry { factory_name: string; deployment_date: string | null }

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function parseFactoryEntries(p: SdPacket): FactoryEntry[] {
  if ((p as any).factory_entries) {
    try { return JSON.parse((p as any).factory_entries) } catch { /* fall through */ }
  }
  return [{ factory_name: p.factory || '—', deployment_date: p.deployment_date ?? null }]
}

export default function ProcessingQueueContent({ initialPackets }: { initialPackets: SdPacket[] }) {
  const [packets, setPackets]       = useState<SdPacket[]>(initialPackets)
  const [loading, setLoading]       = useState(false)
  const [activeForm, setActiveForm] = useState<number | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        apiUrl('/api/packets?statuses=collected_for_ingestion,processing'),
        { cache: 'no-store' }
      )
      if (!res.ok) { setPackets([]); return }
      const data = await res.json()
      setPackets(Array.isArray(data) ? data : [])
    } catch {
      setPackets([])
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="flex flex-col gap-5 max-w-3xl">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Loader2 size={16} className="text-blue-600" />
        <span className="text-sm font-semibold">Processing Queue</span>
        {!loading && packets.length > 0 && (
          <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 text-[10px]">
            {packets.length}
          </Badge>
        )}
        <button
          onClick={fetchAll}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-10 justify-center">
          <Loader2 size={14} className="animate-spin" /> Loading queue…
        </div>
      ) : packets.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-xs text-muted-foreground">
            <Package size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            No packets in the processing queue.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {packets.map(p => {
            const isProcessing = p.status === 'processing'
            const factories    = parseFactoryEntries(p)
            return (
              <div key={p.id}>
                <Card className={`gap-0 py-0 overflow-hidden ${
                  isProcessing ? 'border-blue-200/70 bg-blue-50/20' : 'border-teal-200/70 bg-teal-50/20'
                }`}>
                  <div className={`h-1 ${isProcessing ? 'bg-blue-500' : 'bg-teal-500'}`} />

                  <CardContent className="py-4 px-4 flex flex-col gap-3">

                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm">{p.team_name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">#{p.id}</span>
                          {isProcessing ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold border rounded-full text-blue-700 bg-blue-50 border-blue-200">
                              <Loader2 size={10} className="animate-spin" /> In Progress
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold border rounded-full text-teal-700 bg-teal-50 border-teal-200">
                              <CheckCircle size={10} /> Ready to Process
                            </span>
                          )}
                        </div>
                      </div>
                      {activeForm === p.id ? (
                        <Button size="sm" variant="outline" onClick={() => setActiveForm(null)} className="shrink-0 h-9">Cancel</Button>
                      ) : (
                        <Button
                          size="sm" onClick={() => setActiveForm(p.id)}
                          className="shrink-0 bg-green-600 hover:bg-green-700 text-white gap-1.5 h-9"
                        >
                          <CheckCircle size={11} /> Complete Ingestion
                        </Button>
                      )}
                    </div>

                    {/* Factory / Deployment Date entries */}
                    <div className="bg-muted/40 rounded-lg p-3 flex flex-col gap-1">
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
                            <span className="font-semibold text-foreground">{formatDate(f.deployment_date)}</span>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 text-[12px] pt-1.5 border-t border-border/50">
                        <User size={12} className="text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Team:</span>
                        <span className="font-semibold text-foreground">{p.team_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px]">
                        <CalendarDays size={12} className="text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Date Received:</span>
                        <span className="font-semibold text-foreground">{formatDate(p.date_received)}</span>
                      </div>
                    </div>

                    {/* Count pills */}
                    <div className="flex gap-2 flex-wrap text-[11px]">
                      <div className="flex items-center gap-1.5 bg-muted/60 rounded-md px-2.5 py-1 text-muted-foreground">
                        <Package2 size={11} />
                        <span className="font-semibold text-foreground">{p.sd_card_count}</span> SD cards
                      </div>
                      {(p.num_packages ?? 0) > 0 && (
                        <div className="flex items-center gap-1.5 bg-muted/60 rounded-md px-2.5 py-1 text-muted-foreground">
                          <Boxes size={11} />
                          <span className="font-semibold text-foreground">{p.num_packages}</span> packages
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {p.notes && (
                      <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
                        <FileText size={11} className="mt-0.5 shrink-0" />
                        <span>{p.notes}</span>
                      </div>
                    )}

                    {/* Assigned to */}
                    {p.assigned_to && (
                      <div className="flex items-center gap-1.5 text-[11px] bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
                        <UserCheck size={12} className="text-blue-600 shrink-0" />
                        <span className="text-blue-800">
                          Assigned to <span className="font-bold">{p.assigned_to}</span>
                        </span>
                      </div>
                    )}
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
            )
          })}
        </div>
      )}
    </div>
  )
}
