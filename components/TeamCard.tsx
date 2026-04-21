'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ITEMS } from '@/lib/items'
import type { Transaction } from '@/lib/items'

interface TeamCardProps {
  team: string
  transactions: Transaction[]
}

export default function TeamCard({ team, transactions }: TeamCardProps) {
  const sent     = transactions.filter(t => t.type === 'sent')
  const received = transactions.filter(t => t.type === 'received')

  const sumKey = (rows: Transaction[], key: string) =>
    rows.reduce((s, r) => s + ((r as any)[key] as number || 0), 0)

  const stats = ITEMS.map(item => ({
    ...item,
    sent:        sumKey(sent, item.key),
    received:    sumKey(received, item.key),
    outstanding: sumKey(sent, item.key) - sumKey(received, item.key),
  })).filter(s => s.sent > 0 || s.received > 0)

  const totalOutstanding = stats.reduce((s, i) => s + Math.max(0, i.outstanding), 0)
  const totalSent = stats.reduce((s, i) => s + i.sent, 0)
  const status = totalOutstanding === 0 ? 'success' : totalOutstanding < totalSent * 0.3 ? 'warning' : 'error'
  const statusColor = status === 'success' ? 'var(--chart-2)' : status === 'warning' ? 'var(--chart-3)' : 'var(--chart-4)'

  return (
    <Card className="gap-0 py-0 animate-slide-up">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold">{team}</span>
        <span className="text-[10px] font-medium tabular-nums" style={{ color: statusColor }}>
          {totalOutstanding === 0 ? 'All clear' : `${totalOutstanding} outstanding`}
        </span>
      </div>

      {/* Items grid */}
      <CardContent className="py-3">
        {stats.length === 0 ? (
          <div className="text-[10px] text-muted-foreground">No items</div>
        ) : (
          <div className="space-y-2">
            {stats.map(s => (
              <div key={s.key}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-label">{s.label}</span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {s.received}/{s.sent} returned
                  </span>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="tabular-nums">↑ <span className="font-semibold">{s.sent}</span></span>
                  <span className="tabular-nums text-[var(--chart-2)]">↓ <span className="font-semibold">{s.received}</span></span>
                  <span className="tabular-nums ml-auto" style={{ color: s.outstanding > 0 ? 'var(--chart-4)' : 'var(--chart-2)' }}>
                    {s.outstanding > 0 ? `${s.outstanding} out` : '✓'}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-1 h-0.5 bg-muted overflow-hidden">
                  <div className="h-full bg-foreground transition-all"
                    style={{ width: `${s.sent > 0 ? Math.min(100, Math.round((s.received / s.sent) * 100)) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
