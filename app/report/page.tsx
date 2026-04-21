'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { Transaction } from '@/lib/items'
import { ITEMS } from '@/lib/items'
import { apiUrl } from '@/lib/api'

const ITEM_LABELS = ITEMS.map(i => i.label)

export default function ReportPage() {
  const [records, setRecords]   = useState<Transaction[]>([])
  const [teams, setTeams]       = useState<string[]>([])
  const [loading, setLoading]   = useState(true)
  const [exporting, setExp]     = useState(false)

  // Filters
  const [fromDate, setFrom]   = useState('')
  const [toDate, setTo]       = useState('')
  const [teamFilter, setTeamF] = useState('all')
  const [typeFilter, setTypeF] = useState('all')
  const [itemFilter, setItemF] = useState('all')

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

  useEffect(() => { fetchData() }, [fetchData])

  // Filter by item locally
  const filtered = itemFilter === 'all'
    ? records
    : records.filter(r => {
        const key = ITEMS.find(i => i.label === itemFilter)?.key
        return key ? ((r as any)[key] || 0) > 0 : true
      })

  // Totals row
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

      // Title
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('Build AI Tracker — Report', 14, 16)

      // Filter info
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

      // Totals summary box
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('Summary', 14, 36)
      const summaryHead = [['Item', 'Sent', 'Received', 'Outstanding']]
      const summaryBody = totals
        .filter(t => t.sent > 0 || t.received > 0)
        .map(t => [t.label, String(t.sent), String(t.received), String(Math.max(0, t.sent - t.received))])

      autoTable(doc, {
        head: summaryHead,
        body: summaryBody,
        startY: 38,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        margin: { left: 14, right: 14 },
        tableWidth: 100,
      })

      // Transactions table
      const finalY = (doc as any).lastAutoTable.finalY + 8
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('Transactions', 14, finalY)

      const head = [['Date', 'Team', 'Type', ...ITEM_LABELS, 'Notes']]
      const body = filtered.map(r => [
        String(r.date).slice(0, 10),
        r.team_name,
        r.type.toUpperCase(),
        ...ITEMS.map(i => { const v = (r as any)[i.key]; return v > 0 ? String(v) : '' }),
        r.notes || r.other_description || '',
      ])

      autoTable(doc, {
        head,
        body,
        startY: finalY + 2,
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: { 2: { fontStyle: 'bold' } },
        margin: { left: 14, right: 14 },
      })

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(150)
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 8)
          doc.text('Build AI Tracker', 14, doc.internal.pageSize.height - 8)
      }

      const fileName = `sd-tracker-report-${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(fileName)
    } catch (e) {
      console.error('PDF export error:', e)
    } finally {
      setExp(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Topbar */}
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-11 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="xs" className="gap-1"><ArrowLeft size={11} /> Dashboard</Button>
          </Link>
          <span className="text-border">|</span>
          <span className="text-xs font-semibold">Reports</span>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="xs" onClick={fetchData} className="gap-1">
              <Filter size={11} /> Apply Filters
            </Button>
            <Button size="xs" onClick={exportPDF} disabled={exporting || loading} className="gap-1">
              <Download size={11} />
              {exporting ? 'Exporting…' : 'Export PDF'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 flex flex-col gap-6">

        {/* Filters */}
        <Card className="gap-0 py-0">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-xs font-semibold">Filters</span>
          </div>
          <CardContent className="py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* From Date */}
              <div>
                <label className="text-label block mb-1">From Date</label>
                <Input type="date" value={fromDate} onChange={e => setFrom(e.target.value)} />
              </div>
              {/* To Date */}
              <div>
                <label className="text-label block mb-1">To Date</label>
                <Input type="date" value={toDate} onChange={e => setTo(e.target.value)} />
              </div>
              {/* Team */}
              <div>
                <label className="text-label block mb-1">Team</label>
                <select value={teamFilter} onChange={e => setTeamF(e.target.value)}
                  className="w-full h-8 border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="all">All Teams</option>
                  {teams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {/* Type */}
              <div>
                <label className="text-label block mb-1">Type</label>
                <select value={typeFilter} onChange={e => setTypeF(e.target.value)}
                  className="w-full h-8 border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="all">All Types</option>
                  <option value="sent">Sent</option>
                  <option value="received">Received</option>
                </select>
              </div>
              {/* Item */}
              <div>
                <label className="text-label block mb-1">Item</label>
                <select value={itemFilter} onChange={e => setItemF(e.target.value)}
                  className="w-full h-8 border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="all">All Items</option>
                  {ITEMS.map(i => <option key={i.key} value={i.label}>{i.label}</option>)}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary totals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {totals.filter(t => t.sent > 0 || t.received > 0).map(item => (
            <Card key={item.key} className="gap-0 py-0 animate-fade-in">
              <CardContent className="py-3 flex flex-col gap-1">
                <span className="text-label">{item.label}</span>
                <div className="flex gap-3 text-xs">
                  <span className="tabular-nums">↑ <span className="font-semibold">{item.sent}</span></span>
                  <span className="tabular-nums text-[var(--chart-2)]">↓ <span className="font-semibold">{item.received}</span></span>
                </div>
                <span className="text-[10px] tabular-nums"
                  style={{ color: item.sent - item.received > 0 ? 'var(--chart-4)' : 'var(--chart-2)' }}>
                  {Math.max(0, item.sent - item.received)} out
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className="gap-0 py-0">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold">Transactions</span>
            <Badge variant="outline">{filtered.length} records</Badge>
          </div>
          <CardContent className="py-3 overflow-x-auto">
            {loading ? (
              <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">No records match the selected filters.</div>
            ) : (
              <table className="w-full text-xs border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-label text-left py-2 pr-3 font-normal">Date</th>
                    <th className="text-label text-left py-2 pr-3 font-normal">Team</th>
                    <th className="text-label text-left py-2 pr-3 font-normal">Type</th>
                    {ITEMS.map(i => (
                      <th key={i.key} className="text-label text-right py-2 pr-3 font-normal">{i.label}</th>
                    ))}
                    <th className="text-label text-left py-2 pr-3 font-normal">Notes</th>
                    <th className="text-label text-left py-2 font-normal">Photo</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2 pr-3 font-mono text-muted-foreground">{String(r.date).slice(0, 10)}</td>
                      <td className="py-2 pr-3 font-medium">{r.team_name}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={r.type === 'sent' ? 'default' : 'success'}>
                          {r.type === 'sent' ? '↑ Sent' : '↓ Received'}
                        </Badge>
                      </td>
                      {ITEMS.map(i => {
                        const val = (r as any)[i.key] as number
                        return (
                          <td key={i.key} className="py-2 pr-3 text-right tabular-nums">
                            {val > 0 ? <span className="font-semibold">{val}</span> : <span className="text-muted-foreground">—</span>}
                          </td>
                        )
                      })}
                      <td className="py-2 pr-3 text-muted-foreground max-w-[140px] truncate">
                        {r.notes || r.other_description || '—'}
                      </td>
                      <td className="py-2">
                        {r.photo_url
                          ? <img src={r.photo_url} alt="tx" className="h-8 w-8 object-cover border border-border" />
                          : <span className="text-muted-foreground">—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Totals footer */}
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td className="py-2 pr-3 text-label font-semibold" colSpan={3}>TOTAL</td>
                    {totals.map(item => (
                      <td key={item.key} className="py-2 pr-3 text-right">
                        <div className="text-[10px] font-semibold tabular-nums">↑{item.sent}</div>
                        <div className="text-[10px] tabular-nums text-[var(--chart-2)]">↓{item.received}</div>
                      </td>
                    ))}
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            )}
          </CardContent>
        </Card>

      </main>

      <footer className="border-t border-border py-3 text-center text-[10px] text-muted-foreground uppercase tracking-wider">
        Build AI Tracker · Reports
      </footer>
    </div>
  )
}
