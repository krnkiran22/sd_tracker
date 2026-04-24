'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Filter, Search, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { Transaction } from '@/lib/items'
import { ITEMS } from '@/lib/items'
import { apiUrl } from '@/lib/api'

const ITEM_LABELS = ITEMS.map(i => i.label)

export default function ReportPageContent({
  initialRecords,
  initialTeams,
}: {
  initialRecords?: Transaction[]
  initialTeams?: string[]
}) {
  const [records, setRecords] = useState<Transaction[]>(initialRecords ?? [])
  const [teams, setTeams]     = useState<string[]>(initialTeams ?? [])
  const [loading, setLoading] = useState(false)
  const [exporting, setExp]   = useState(false)

  // Server-side filters (applied on fetch)
  const [fromDate,    setFrom]    = useState('')
  const [toDate,      setTo]      = useState('')
  const [teamFilter,  setTeamF]   = useState('all')
  const [typeFilter,  setTypeF]   = useState('all')

  // Client-side filters
  const [itemFilter,    setItemF]    = useState('all')
  const [handlerFilter, setHandlerF] = useState('all')
  const [searchText,    setSearch]   = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (teamFilter !== 'all') params.set('team', teamFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (fromDate)             params.set('from', fromDate)
      if (toDate)               params.set('to', toDate)

      const [txRes, teamsRes] = await Promise.all([
        fetch(apiUrl(`/api/transactions?${params}`), { cache: 'no-store' }),
        fetch(apiUrl('/api/teams'), { cache: 'no-store' }),
      ])
      const txData    = await txRes.json()
      const teamsData = await teamsRes.json()
      if (Array.isArray(txData))    setRecords(txData)
      if (Array.isArray(teamsData)) setTeams(teamsData)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [fromDate, toDate, teamFilter, typeFilter])

  // Only refetch client-side when there are no server-provided initial records
  // (user-triggered refetches via "Apply Filters" always work regardless)
  useEffect(() => {
    if (!initialRecords) fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Unique handlers from loaded records
  const handlers = useMemo(() => {
    const set = new Set(records.map(r => r.entered_by).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [records])

  // Client-side filtered rows
  const filtered = useMemo(() => {
    return records.filter(r => {
      if (itemFilter !== 'all') {
        const key = ITEMS.find(i => i.label === itemFilter)?.key
        if (key && !((r as any)[key] > 0)) return false
      }
      if (handlerFilter !== 'all' && r.entered_by !== handlerFilter) return false
      if (searchText && !r.team_name.toLowerCase().includes(searchText.toLowerCase())) return false
      return true
    })
  }, [records, itemFilter, handlerFilter, searchText])

  const totals = ITEMS.map(item => ({
    ...item,
    sent:     filtered.filter(r => r.type === 'sent').reduce((s, r) => s + ((r as any)[item.key] || 0), 0),
    received: filtered.filter(r => r.type === 'received').reduce((s, r) => s + ((r as any)[item.key] || 0), 0),
  }))

  const exportPDF = async () => {
    setExp(true)
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable  = (await import('jspdf-autotable')).default

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('Build AI Tracker — Report', 14, 16)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const filterParts = [
        teamFilter !== 'all' ? `Team: ${teamFilter}` : 'All Teams',
        typeFilter !== 'all' ? `Type: ${typeFilter}` : 'All Types',
        fromDate ? `From: ${fromDate}` : '',
        toDate   ? `To: ${toDate}`   : '',
      ].filter(Boolean).join('  |  ')
      doc.text(filterParts, 14, 23)
      doc.text(`Generated: ${new Date().toLocaleString()}  |  ${filtered.length} records`, 14, 28)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('Summary', 14, 36)
      const summaryHead = [['Item', 'Sent', 'Received', 'Outstanding']]
      const summaryBody = totals
        .filter(t => t.sent > 0 || t.received > 0)
        .map(t => [t.label, String(t.sent), String(t.received), String(Math.max(0, t.sent - t.received))])

      autoTable(doc, {
        head: summaryHead, body: summaryBody, startY: 38,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        margin: { left: 14, right: 14 }, tableWidth: 100,
      })

      const finalY = (doc as any).lastAutoTable.finalY + 8
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
      doc.text('Transactions', 14, finalY)

      const head = [['Date', 'Team', 'Type', 'Handler', ...ITEM_LABELS, 'Notes']]
      const body = filtered.map(r => [
        String(r.date).slice(0, 10), r.team_name, r.type.toUpperCase(),
        r.entered_by || '—',
        ...ITEMS.map(i => { const v = (r as any)[i.key]; return v > 0 ? String(v) : '' }),
        r.notes || r.other_description || '',
      ])

      autoTable(doc, {
        head, body, startY: finalY + 2,
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: { 2: { fontStyle: 'bold' } },
        margin: { left: 14, right: 14 },
      })

      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(150)
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 8)
        doc.text('Build AI Tracker', 14, doc.internal.pageSize.height - 8)
      }

      doc.save(`sd-tracker-report-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (e) { console.error('PDF export error:', e) }
    finally { setExp(false) }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-base font-semibold">Reports</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Filter, search and export transaction history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="xs" onClick={fetchData} className="gap-1">
            <Filter size={11} /> Apply Filters
          </Button>
          <Button size="xs" onClick={exportPDF} disabled={exporting || loading} className="gap-1">
            <Download size={11} />
            {exporting ? 'Exporting…' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* ── Server-side Filters ─────────────────────────────────────────────── */}
      <Card className="gap-0 py-0">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-xs font-semibold">Filters</span>
          <span className="text-[10px] text-muted-foreground ml-2">Click "Apply Filters" to fetch</span>
        </div>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-label block mb-1">From Date</label>
              <Input type="date" value={fromDate} onChange={e => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-label block mb-1">To Date</label>
              <Input type="date" value={toDate} onChange={e => setTo(e.target.value)} />
            </div>
            <div>
              <label className="text-label block mb-1">Team</label>
              <select value={teamFilter} onChange={e => setTeamF(e.target.value)}
                className="w-full h-8 border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="all">All Teams</option>
                {teams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-label block mb-1">Type</label>
              <select value={typeFilter} onChange={e => setTypeF(e.target.value)}
                className="w-full h-8 border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="all">All Types</option>
                <option value="sent">Sent</option>
                <option value="received">Received</option>
              </select>
            </div>
            <div>
              <label className="text-label block mb-1">Item</label>
              <select value={itemFilter} onChange={e => setItemF(e.target.value)}
                className="w-full h-8 border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="all">All Items</option>
                {ITEMS.map(i => <option key={i.key} value={i.label}>{i.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-label block mb-1">Event Handler</label>
              <select value={handlerFilter} onChange={e => setHandlerF(e.target.value)}
                className="w-full h-8 border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="all">All Handlers</option>
                {handlers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Summary totals ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {totals.filter(t => t.sent > 0 || t.received > 0).map(item => (
          <Card key={item.key} className="gap-0 py-0 animate-fade-in">
            <CardContent className="py-3 flex flex-col gap-1">
              <span className="text-label">{item.label}</span>
              <div className="flex gap-3 text-xs">
                <span className="tabular-nums">↑ <span className="font-semibold">{item.sent}</span></span>
                <span className="tabular-nums text-amber-600">↓ <span className="font-semibold">{item.received}</span></span>
              </div>
              <span className="text-[10px] tabular-nums font-medium"
                style={{ color: item.sent - item.received > 0 ? '#d97706' : '#16a34a' }}>
                {Math.max(0, item.sent - item.received)} out
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Transactions table ──────────────────────────────────────────────── */}
      <Card className="gap-0 py-0">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold">Transactions</span>
          <Badge variant="outline">{filtered.length} records</Badge>
          <div className="ml-auto relative w-48">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={searchText}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search team…"
              className="h-7 pl-8 text-xs"
            />
            {searchText && (
              <button onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        <CardContent className="py-0 px-0 overflow-x-auto">
          {loading ? (
            <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">
              No records match the selected filters.
            </div>
          ) : (
            <table className="w-full text-xs border-collapse min-w-[960px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-label text-left py-2.5 px-4 font-medium">Date</th>
                  <th className="text-label text-left py-2.5 pr-3 font-medium">Team</th>
                  <th className="text-label text-left py-2.5 pr-3 font-medium">Type</th>
                  <th className="text-label text-left py-2.5 pr-3 font-medium">Event Handler</th>
                  {ITEMS.map(i => (
                    <th key={i.key} className="text-label text-right py-2.5 pr-3 font-medium">{i.label}</th>
                  ))}
                  <th className="text-label text-left py-2.5 pr-3 font-medium">Notes</th>
                  <th className="text-label text-left py-2.5 pr-3 font-medium">Photo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-muted-foreground">{String(r.date).slice(0, 10)}</td>
                    <td className="py-2.5 pr-3 font-medium">{r.team_name}</td>
                    <td className="py-2.5 pr-3">
                      <Badge variant={r.type === 'sent' ? 'default' : 'success'}>
                        {r.type === 'sent' ? '↑ Sent' : '↓ Received'}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3">
                      {r.entered_by
                        ? <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-medium rounded-full">
                            {r.entered_by}
                          </span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    {ITEMS.map(i => {
                      const val = (r as any)[i.key] as number
                      return (
                        <td key={i.key} className="py-2.5 pr-3 text-right tabular-nums">
                          {val > 0
                            ? <span className="font-semibold">{val}</span>
                            : <span className="text-muted-foreground/40">—</span>}
                        </td>
                      )
                    })}
                    <td className="py-2.5 pr-3 text-muted-foreground max-w-[140px] truncate">
                      {r.notes || r.other_description || '—'}
                    </td>
                    <td className="py-2.5 pr-3">
                      {r.photo_url
                        ? <img src={r.photo_url} alt="tx" className="h-8 w-8 object-cover border border-border rounded-sm" />
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/30">
                  <td className="py-2.5 px-4 text-label font-semibold" colSpan={4}>TOTAL</td>
                  {totals.map(item => (
                    <td key={item.key} className="py-2.5 pr-3 text-right">
                      <div className="text-[10px] font-semibold tabular-nums">↑{item.sent}</div>
                      <div className="text-[10px] tabular-nums text-amber-600">↓{item.received}</div>
                    </td>
                  ))}
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
