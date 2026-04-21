'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'

interface TeamSummary {
  team: string
  sent: number
  returned: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const outstanding = payload[0]?.value ?? 0
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '8px 12px', fontSize: 11 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ color: 'var(--muted-foreground)', textTransform: 'uppercase', fontSize: 10 }}>Outstanding</span>
        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{outstanding}</span>
      </div>
    </div>
  )
}

export function OutstandingChart({ data }: { data: TeamSummary[] }) {
  const chartData = data
    .map(d => ({ team: d.team, outstanding: Math.max(0, d.sent - d.returned) }))
    .sort((a, b) => b.outstanding - a.outstanding)

  if (!chartData.length) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No data</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="40%">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
        <XAxis
          dataKey="team"
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
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', fillOpacity: 0.4 }} />
        <Bar dataKey="outstanding" name="Outstanding" radius={[1, 1, 0, 0]} animationDuration={400}>
          {chartData.map((entry) => (
            <Cell
              key={entry.team}
              fill={entry.outstanding === 0 ? 'var(--chart-2)' : 'var(--chart-4)'}
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
