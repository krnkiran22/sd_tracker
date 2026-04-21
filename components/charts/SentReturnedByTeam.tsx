'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface TeamSummary {
  team: string
  sent: number
  returned: number
}

interface Props {
  data: TeamSummary[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '8px 12px', fontSize: 11 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: 'var(--muted-foreground)', textTransform: 'uppercase', fontSize: 10 }}>{p.name}</span>
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{p.value}</span>
        </div>
      ))}
      <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ color: 'var(--muted-foreground)', textTransform: 'uppercase', fontSize: 10 }}>Outstanding</span>
        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--error, #e44)' }}>
          {(payload.find((p: any) => p.dataKey === 'sent')?.value ?? 0) - (payload.find((p: any) => p.dataKey === 'returned')?.value ?? 0)}
        </span>
      </div>
    </div>
  )
}

export function SentReturnedByTeam({ data }: Props) {
  if (!data.length) {
    return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No data</div>
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={2} barCategoryGap="35%">
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
        <Legend
          wrapperStyle={{ fontSize: 10, paddingTop: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}
          iconType="square"
          iconSize={8}
        />
        <Bar dataKey="sent" name="Sent" fill="var(--chart-1)" fillOpacity={0.75} radius={[1, 1, 0, 0]} animationDuration={400} />
        <Bar dataKey="returned" name="Returned" fill="var(--chart-2)" fillOpacity={0.75} radius={[1, 1, 0, 0]} animationDuration={400} />
      </BarChart>
    </ResponsiveContainer>
  )
}
