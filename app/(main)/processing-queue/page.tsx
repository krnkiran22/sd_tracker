'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, CheckCircle, RefreshCw, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import IngestionForm from '@/components/IngestionForm'
import type { SdPacket } from '@/lib/types'
import { apiUrl } from '@/lib/api'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ProcessingQueuePage() {
  const [packets, setPackets]     = useState<SdPacket[]>([])
  const [loading, setLoading]     = useState(true)
  const [activeForm, setActiveForm] = useState<number | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/packets?status=processing'), { cache: 'no-store' })
      const data: SdPacket[] = await res.json()
      if (Array.isArray(data)) setPackets(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return (
    <div className="flex flex-col gap-5 max-w-3xl">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Loader2 size={16} className="text-blue-600 animate-spin" />
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
          {packets.map(p => (
            <div key={p.id}>
              <Card className="gap-0 py-0 border-blue-200/70 bg-blue-50/30">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{p.team_name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">#{p.id}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold border rounded-full text-blue-700 bg-blue-50 border-blue-200">
                          <Loader2 size={10} className="animate-spin" /> Processing
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span>Factory: <strong className="text-foreground">{p.factory || '—'}</strong></span>
                        <span>Received: <strong className="text-foreground">{formatDate(p.date_received)}</strong></span>
                        <span>SD Cards: <strong className="text-foreground text-base">{p.sd_card_count}</strong></span>
                        {p.entered_by && <span>By: {p.entered_by}</span>}
                      </div>
                      {p.notes && <p className="text-[10px] text-muted-foreground italic mt-0.5">{p.notes}</p>}
                    </div>

                    {activeForm === p.id ? (
                      <Button size="sm" variant="outline" onClick={() => setActiveForm(null)} className="shrink-0 h-9">
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setActiveForm(p.id)}
                        className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-9"
                      >
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
    </div>
  )
}
