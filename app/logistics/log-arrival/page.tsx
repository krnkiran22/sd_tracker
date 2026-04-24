'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Package, X, Plus, Loader2, RefreshCw,
  ChevronDown, ChevronUp, Search, SlidersHorizontal,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/AuthProvider'
import { apiUrl } from '@/lib/api'

interface TeamInfo { name: string; poc_emails: string; poc_phones: string }

interface LogisticsPacket {
  id: number
  team_name: string
  date_received: string
  status: string
  poc_phones: string
  entered_by: string
  created_at: string
}

function fmtDate(d: string) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}

function fmtDateTime(d: string) {
  return d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  received_at_hq:    { label: 'Received at HQ',      cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  counted_repacked:  { label: 'Counted & Repacked',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  sent_to_ingestion: { label: 'Sent to Ingestion',    cls: 'bg-green-50 text-green-700 border-green-200' },
  received:          { label: 'Received',              cls: 'bg-gray-50 text-gray-600 border-gray-200' },
  processing:        { label: 'Processing',            cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  completed:         { label: 'Completed',             cls: 'bg-green-50 text-green-700 border-green-200' },
}

function StatusBadge({ status }: { status: string }) {
  const info = STATUS_LABELS[status] ?? { label: status, cls: 'bg-gray-50 text-gray-600 border-gray-200' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold border rounded-full ${info.cls}`}>
      {info.label}
    </span>
  )
}

export default function LogArrivalPage() {
  const { user } = useAuth()

  // ── Form state ─────────────────────────────────────────────────────────────
  const [allTeams, setAllTeams]         = useState<TeamInfo[]>([])
  const [teamInput, setTeamInput]       = useState('')
  const [suggestions, setSuggestions]   = useState<TeamInfo[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10))
  const [pocPhones, setPocPhones]       = useState('')
  const [phoneInput, setPhoneInput]     = useState('')
  const [receivedBy, setReceivedBy]     = useState('')

  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitOk, setSubmitOk]       = useState(false)

  // ── Arrivals log state ─────────────────────────────────────────────────────
  const [allPackets, setAllPackets]   = useState<LogisticsPacket[]>([])
  const [loadingLog, setLoadingLog]   = useState(true)
  const [sortDesc, setSortDesc]       = useState(true)
  const [logSearch, setLogSearch]     = useState('')
  const [logStatus, setLogStatus]     = useState('all')
  const [logFrom, setLogFrom]         = useState('')
  const [logTo, setLogTo]             = useState('')
  const [showLogFilter, setShowLogFilter] = useState(false)

  // ── Load teams ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(apiUrl('/api/teams'))
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAllTeams(d) })
      .catch(() => {})
  }, [])

  // ── Autocomplete ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!teamInput.trim()) { setSuggestions([]); return }
    const q = teamInput.toLowerCase()
    setSuggestions(allTeams.filter(t => t.name.toLowerCase().includes(q)))
  }, [teamInput, allTeams])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectTeam = (team: TeamInfo) => {
    setTeamInput(team.name)
    setShowDropdown(false)
    if (team.poc_phones) {
      const incoming = team.poc_phones.split(',').map(p => p.trim()).filter(Boolean)
      const current  = pocPhones ? pocPhones.split(',').map(p => p.trim()).filter(Boolean) : []
      setPocPhones(Array.from(new Set([...current, ...incoming])).join(', '))
    }
  }

  const phoneList = pocPhones ? pocPhones.split(',').map(p => p.trim()).filter(Boolean) : []

  const addPhone = () => {
    const p = phoneInput.trim()
    if (!p) return
    if (!phoneList.includes(p)) setPocPhones([...phoneList, p].join(', '))
    setPhoneInput('')
  }
  const removePhone = (phone: string) => setPocPhones(phoneList.filter(p => p !== phone).join(', '))

  // ── Load all arrivals ──────────────────────────────────────────────────────
  const loadLog = useCallback(async () => {
    setLoadingLog(true)
    try {
      const res = await fetch(apiUrl('/api/packets'), { cache: 'no-store' })
      const d = await res.json()
      if (Array.isArray(d)) setAllPackets(d)
    } catch { /* ignore */ }
    finally { setLoadingLog(false) }
  }, [])

  useEffect(() => { loadLog() }, [loadLog])

  // ── Submit new arrival ─────────────────────────────────────────────────────
  const handleLogArrival = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    if (!teamInput.trim()) { setSubmitError('Team name is required.'); return }
    if (!receivedBy)       { setSubmitError('Please select who is receiving this packet.'); return }

    setSubmitting(true)
    try {
      const res = await fetch(apiUrl('/api/packets'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name:     teamInput.trim(),
          received_date: receivedDate,
          poc_phones:    pocPhones,
          entered_by:    receivedBy,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }

      setTeamInput(''); setPocPhones(''); setPhoneInput(''); setReceivedBy('')
      setReceivedDate(new Date().toISOString().slice(0, 10))
      setSubmitOk(true)
      setTimeout(() => setSubmitOk(false), 4000)
      loadLog()
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const sortedPackets = [...allPackets]
    .filter(p => {
      if (logSearch && !p.team_name.toLowerCase().includes(logSearch.toLowerCase())) return false
      if (logStatus !== 'all' && p.status !== logStatus) return false
      const d = String(p.date_received).slice(0, 10)
      if (logFrom && d < logFrom) return false
      if (logTo   && d > logTo)   return false
      return true
    })
    .sort((a, b) =>
      sortDesc
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

  const logActiveFilters = (logSearch ? 1 : 0) + (logStatus !== 'all' ? 1 : 0) +
    (logFrom ? 1 : 0) + (logTo ? 1 : 0)

  return (
    <div className="flex flex-col gap-6 max-w-3xl">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Package size={16} className="text-blue-600" />
        <span className="text-sm font-semibold">Log New Arrival</span>
      </div>

      {/* ── Log arrival form ─────────────────────────────────────────────── */}
      <Card className="py-4 gap-0 border-blue-200/60 bg-blue-50/30">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Package size={14} className="text-blue-600" />
            Log New Arrival
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleLogArrival} className="flex flex-col gap-4">

            {/* Team + date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div ref={dropdownRef} className="relative">
                <label className="text-label block mb-1">Team Name *</label>
                <Input
                  value={teamInput}
                  onChange={e => { setTeamInput(e.target.value); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Type or select team…"
                  autoComplete="off"
                />
                {showDropdown && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-card border border-border shadow-md max-h-48 overflow-y-auto rounded-b">
                    {suggestions.map(s => (
                      <button
                        key={s.name}
                        type="button"
                        className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                        onMouseDown={() => selectTeam(s)}
                      >
                        <span className="font-medium">{s.name}</span>
                        {s.poc_phones && (
                          <span className="block text-green-700 text-[10px] truncate mt-0.5">
                            📱 {s.poc_phones}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-label block mb-1">Date Received *</label>
                <Input
                  type="date"
                  value={receivedDate}
                  onChange={e => setReceivedDate(e.target.value)}
                />
              </div>
            </div>

            {/* WhatsApp numbers */}
            <div>
              <label className="text-label block mb-1">
                WhatsApp Numbers
                <span className="ml-1 text-muted-foreground font-normal">(auto-filled when team is selected)</span>
              </label>
              <div className="flex gap-2">
                <Input
                  type="tel"
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPhone() } }}
                  placeholder="+919876543210 — press Enter to add"
                />
                <Button type="button" variant="outline" size="sm" onClick={addPhone} className="shrink-0">
                  <Plus size={12} />
                </Button>
              </div>
              {phoneList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {phoneList.map(phone => (
                    <span
                      key={phone}
                      className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full font-medium"
                    >
                      {phone}
                      <button
                        type="button"
                        onClick={() => removePhone(phone)}
                        className="hover:text-red-600 transition-colors ml-0.5"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                WhatsApp notification will be sent to these numbers immediately on submit.
              </p>
            </div>

            {/* Who is receiving */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-label block mb-1">
                  Who is Receiving? <span className="text-destructive">*</span>
                </label>
                <p className="text-[10px] text-muted-foreground mb-1.5">
                  Person physically receiving the SD card packet at HQ
                </p>
                <select
                  value={receivedBy}
                  onChange={e => setReceivedBy(e.target.value)}
                  className="w-full h-9 border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring rounded"
                >
                  <option value="">— Select receiver —</option>
                  <option value="Amaan">Amaan</option>
                  <option value="Nathish">Nathish</option>
                  {user?.name && !['Amaan', 'Nathish'].includes(user.name) && (
                    <option value={user.name}>{user.name}</option>
                  )}
                </select>
              </div>
            </div>

            {submitError && <p className="text-[10px] text-destructive">{submitError}</p>}
            {submitOk && (
              <p className="text-[10px] text-green-600 font-medium">
                ✓ Arrival logged. WhatsApp notification sent to POCs.
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto sm:self-start gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting
                ? <Loader2 size={12} className="animate-spin" />
                : <Package size={12} />}
              {submitting ? 'Logging…' : 'Log Arrival'}
            </Button>

          </form>
        </CardContent>
      </Card>

      {/* ── Arrivals log table ────────────────────────────────────────────── */}
      <Card className="gap-0 py-0 overflow-hidden">
        {/* Header row */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold">All Arrivals Log</span>
          {!loadingLog && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              {sortedPackets.length} / {allPackets.length}
            </Badge>
          )}
          <button onClick={loadLog} className="text-muted-foreground hover:text-foreground transition-colors" title="Refresh">
            <RefreshCw size={11} className={loadingLog ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Search + filter bar */}
        <div className="px-4 py-3 border-b border-border flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input value={logSearch} onChange={e => setLogSearch(e.target.value)}
                placeholder="Search team…" className="h-8 pl-8 text-xs" />
              {logSearch && (
                <button onClick={() => setLogSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={11} />
                </button>
              )}
            </div>
            <button onClick={() => setShowLogFilter(v => !v)}
              className={`flex items-center gap-1.5 h-8 px-3 text-xs border rounded transition-colors ${
                showLogFilter || logActiveFilters > 0
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground'
              }`}>
              <SlidersHorizontal size={11} />
              Filters
              {logActiveFilters > 0 && (
                <span className="bg-background text-foreground rounded-full px-1 text-[9px] font-bold leading-none py-0.5">
                  {logActiveFilters}
                </span>
              )}
            </button>
            {logActiveFilters > 0 && (
              <button onClick={() => { setLogSearch(''); setLogStatus('all'); setLogFrom(''); setLogTo('') }}
                className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1">
                <X size={10} /> Clear
              </button>
            )}
            <span className="ml-auto text-[10px] text-muted-foreground">
              {sortedPackets.length} / {allPackets.length} rows
            </span>
          </div>
          {showLogFilter && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-border/50">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Status</label>
                <select value={logStatus} onChange={e => setLogStatus(e.target.value)}
                  className="w-full h-8 border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring rounded">
                  <option value="all">All Statuses</option>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">From Date</label>
                <Input type="date" value={logFrom} onChange={e => setLogFrom(e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">To Date</label>
                <Input type="date" value={logTo} onChange={e => setLogTo(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
          )}
        </div>

        {loadingLog ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-8 px-4">
            <Loader2 size={14} className="animate-spin" /> Loading arrivals log…
          </div>
        ) : allPackets.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">No arrivals logged yet.</div>
        ) : sortedPackets.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">No records match filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                  <tr className="border-b border-border bg-muted/30 text-left">
                  <th className="px-3 py-2.5 font-semibold text-muted-foreground">#</th>
                  <th className="px-3 py-2.5 font-semibold text-muted-foreground">Team</th>
                  <th className="px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">Date Received</th>
                  <th className="px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">Received By</th>
                  <th className="px-3 py-2.5 font-semibold text-muted-foreground">Status</th>
                  <th className="px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">WhatsApp Nos.</th>
                  <th className="px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap cursor-pointer select-none hover:text-foreground"
                    onClick={() => setSortDesc(d => !d)}>
                    Logged At {sortDesc ? <ChevronDown size={10} className="inline" /> : <ChevronUp size={10} className="inline" />}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedPackets.map(p => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2 font-mono text-muted-foreground">{p.id}</td>
                    <td className="px-3 py-2 font-medium">{p.team_name}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{fmtDate(p.date_received)}</td>
                    <td className="px-3 py-2">
                      {p.entered_by
                        ? <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-medium rounded-full">{p.entered_by}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                    <td className="px-3 py-2 text-muted-foreground max-w-[140px] truncate">{p.poc_phones || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{fmtDateTime(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

    </div>
  )
}
