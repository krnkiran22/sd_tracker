'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface SDRecord {
  Team: string
  Date: string
  Sent: number
  Returned: number
}

interface TimePoint {
  date: string
  sent: number
  returned: number
  outstanding: number
}

export function buildTimeline(records: SDRecord[]): TimePoint[] {
  const byDate: Record<string, { sent: number; returned: number }> = {}
  for (const r of records) {
    if (!byDate[r.Date]) byDate[r.Date] = { sent: 0, returned: 0 }
    byDate[r.Date].sent += Number(r.Sent ?? 0)
    byDate[r.Date].returned += Number(r.Returned ?? 0)
  }
  const sorted = Object.keys(byDate).sort()
  let cumSent = 0
  let cumReturned = 0
  return sorted.map(date => {
    cumSent += byDate[date].sent
    cumReturned += byDate[date].returned
    return { date, sent: cumSent, returned: cumReturned, outstanding: cumSent - cumReturned }
  })
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '8px 12px', fontSize: 11 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: p.color, textTransform: 'uppercase', fontSize: 10 }}>{p.name}</span>
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function CirculationTimeline({ records }: { records: SDRecord[] }) {
  const data = buildTimeline(records)
  if (!data.length) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No data</div>
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          width={28}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 10, paddingTop: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}
          iconType="circle"
          iconSize={6}
        />
        <Line
          type="monotone"
          dataKey="sent"
          name="Total Sent"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3 }}
          animationDuration={400}
        />
        <Line
          type="monotone"
          dataKey="returned"
          name="Total Returned"
          stroke="var(--chart-2)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3 }}
          animationDuration={400}
        />
        <Line
          type="monotone"
          dataKey="outstanding"
          name="Outstanding"
          stroke="var(--chart-4)"
          strokeWidth={2}
          strokeDasharray="4 2"
          dot={false}
          activeDot={{ r: 3 }}
          animationDuration={400}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
