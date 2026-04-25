'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Package, X, Plus, Loader2, RefreshCw,
  ChevronDown, ChevronUp, Search, SlidersHorizontal, Camera, ImageIcon,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/AuthProvider'
import { apiUrl } from '@/lib/api'

export interface TeamInfo { name: string; poc_emails: string; poc_phones: string }

export interface LogisticsPacket {
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
  received_at_hq:    { label: 'Received at HQ',    cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  counted_repacked:  { label: 'Counted & Repacked', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  sent_to_ingestion: { label: 'Sent to Ingestion',  cls: 'bg-green-50 text-green-700 border-green-200' },
  received:          { label: 'Received',            cls: 'bg-gray-50 text-gray-600 border-gray-200' },
  processing:        { label: 'Processing',          cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  completed:         { label: 'Completed',           cls: 'bg-green-50 text-green-700 border-green-200' },
}

function StatusBadge({ status }: { status: string }) {
  const info = STATUS_LABELS[status] ?? { label: status, cls: 'bg-gray-50 text-gray-600 border-gray-200' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold border rounded-full ${info.cls}`}>
      {info.label}
    </span>
  )
}

export default function LogArrivalContent({
  initialTeams,
  initialPackets,
}: {
  initialTeams: TeamInfo[]
  initialPackets: LogisticsPacket[]
}) {
  const { user } = useAuth()

  // ── Form state ─────────────────────────────────────────────────────────────
  const [allTeams, setAllTeams]         = useState<TeamInfo[]>(initialTeams)
  const [teamInput, setTeamInput]       = useState('')
  const [suggestions, setSuggestions]   = useState<TeamInfo[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10))
  const [pocPhones, setPocPhones]       = useState('')
  const [phoneInput, setPhoneInput]     = useState('')
  const [receivedBy, setReceivedBy]     = useState('')

  const [photoDataUrls, setPhotoDataUrls] = useState<string[]>([])
  const cameraInputRef  = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitOk, setSubmitOk]       = useState(false)

  // ── Arrivals log state ─────────────────────────────────────────────────────
  const [allPackets, setAllPackets]   = useState<LogisticsPacket[]>(initialPackets)
  const [loadingLog, setLoadingLog]   = useState(false)
  const [sortDesc, setSortDesc]       = useState(true)
  const [logSearch, setLogSearch]     = useState('')
  const [logStatus, setLogStatus]     = useState('all')
  const [logFrom, setLogFrom]         = useState('')
  const [logTo, setLogTo]             = useState('')
  const [showLogFilter, setShowLogFilter] = useState(false)
  const [phoneError, setPhoneError]   = useState('')

  // ── Load teams (refresh) ───────────────────────────────────────────────────
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

  const to10Digits = (p: string) => {
    const d = p.replace(/\D/g, '')
    if (d.length === 12 && d.startsWith('91')) return d.slice(2)
    if (d.length === 11 && d.startsWith('0'))  return d.slice(1)
    return d.slice(-10)
  }

  const selectTeam = (team: TeamInfo) => {
    setTeamInput(team.name)
    setShowDropdown(false)
    if (team.poc_phones) {
      const incoming = team.poc_phones.split(',').map(p => to10Digits(p.trim())).filter(p => p.length === 10)
      const current  = pocPhones ? pocPhones.split(',').map(p => p.trim()).filter(Boolean) : []
      setPocPhones(Array.from(new Set([...current, ...incoming])).join(', '))
    }
  }

  const phoneList = pocPhones ? pocPhones.split(',').map(p => p.trim()).filter(Boolean) : []

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    Promise.all(
      files.map(f => new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload  = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(f)
      }))
    ).then(urls => setPhotoDataUrls(prev => [...prev, ...urls]))
    e.target.value = ''
  }

  const removePhoto = (idx: number) =>
    setPhotoDataUrls(prev => prev.filter((_, i) => i !== idx))

  const addPhone = () => {
    const digits = phoneInput.replace(/\D/g, '')
    if (!digits) { setPhoneError(''); setPhoneInput(''); return }
    if (digits.length !== 10) { setPhoneError('Enter exactly 10 digits.'); return }
    setPhoneError('')
    if (!phoneList.includes(digits)) setPocPhones([...phoneList, digits].join(', '))
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

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleLogArrival = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    if (!teamInput.trim())          { setSubmitError('Team name is required.'); return }
    if (!receivedBy)                { setSubmitError('Please select who is receiving this packet.'); return }
    if (photoDataUrls.length === 0) { setSubmitError('At least one photo of the packet is required.'); return }

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
          photo_urls:    photoDataUrls.length > 0 ? JSON.stringify(photoDataUrls) : null,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }

      setTeamInput(''); setPocPhones(''); setPhoneInput(''); setReceivedBy('')
      setReceivedDate(new Date().toISOString().slice(0, 10))
      setPhotoDataUrls([])
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

      {/* Page header */}
      <div className="flex items-center gap-2">
        <Package size={16} className="text-blue-600" />
        <span className="text-sm font-semibold">Log New Arrival</span>
      </div>

      {/* Log arrival form */}
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
                        key={s.name} type="button"
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
                <Input type="date" value={receivedDate} onChange={e => setReceivedDate(e.target.value)} />
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
                  type="tel" inputMode="numeric" maxLength={10}
                  value={phoneInput}
                  onChange={e => { const digits = e.target.value.replace(/\D/g, '').slice(0, 10); setPhoneInput(digits); setPhoneError('') }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPhone() } }}
                  placeholder="10-digit number, e.g. 9876543210"
                />
                <Button type="button" variant="outline" size="sm" onClick={addPhone} className="shrink-0">
                  <Plus size={12} />
                </Button>
              </div>
              {phoneError && <p className="text-[10px] text-destructive mt-1">{phoneError}</p>}
              {phoneList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {phoneList.map(phone => (
                    <span key={phone} className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full font-medium">
                      📱 {phone}
                      <button type="button" onClick={() => removePhone(phone)} className="hover:text-red-600 transition-colors ml-0.5">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                Enter 10-digit mobile number (without +91). +91 is added automatically. Add multiple numbers.
              </p>
            </div>

            {/* Who is receiving */}
            <div>
              <label className="text-label block mb-1">
                Who is Receiving? <span className="text-destructive">*</span>
              </label>
              <p className="text-[10px] text-muted-foreground mb-1.5">
                Person physically receiving the SD card packet at HQ
              </p>
              <select
                value={receivedBy} onChange={e => setReceivedBy(e.target.value)}
                className="w-full h-10 border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring rounded"
              >
                <option value="">— Select receiver —</option>
                <option value="Amaan">Amaan</option>
                <option value="Naresh">Naresh</option>
                <option value="Nathish">Nathish</option>
                {user?.name && !['Amaan', 'Naresh', 'Nathish'].includes(user.name) && (
                  <option value={user.name}>{user.name}</option>
                )}
              </select>
            </div>

            {/* Photos */}
            <div>
              <label className="text-label block mb-1">
                Photos <span className="text-destructive">*</span>
              </label>
              <p className="text-[10px] text-muted-foreground mb-2">
                Take a photo of the packet or upload from your gallery. You can add multiple photos.
              </p>

              {/* Camera input — opens camera directly */}
              <input
                ref={cameraInputRef} type="file" accept="image/*" capture="environment"
                multiple className="hidden" onChange={handlePhotoChange}
              />
              {/* Gallery input — opens file picker / gallery */}
              <input
                ref={galleryInputRef} type="file" accept="image/*"
                multiple className="hidden" onChange={handlePhotoChange}
              />

              <div className="flex gap-2 flex-wrap">
                <button
                  type="button" onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2 h-9 px-3 text-xs border border-dashed border-blue-400 rounded hover:border-blue-600 hover:bg-blue-50/60 transition-colors text-blue-600 font-medium"
                >
                  <Camera size={13} />
                  {photoDataUrls.length > 0 ? 'Take More' : 'Take Photo'}
                </button>
                <button
                  type="button" onClick={() => galleryInputRef.current?.click()}
                  className="flex items-center gap-2 h-9 px-3 text-xs border border-dashed border-violet-400 rounded hover:border-violet-600 hover:bg-violet-50/60 transition-colors text-violet-600 font-medium"
                >
                  <ImageIcon size={13} />
                  {photoDataUrls.length > 0 ? 'Add from Gallery' : 'Upload from Gallery'}
                </button>
              </div>
              {photoDataUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {photoDataUrls.map((url, idx) => (
                    <div key={idx} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Photo ${idx + 1}`} className="w-20 h-20 object-cover rounded border border-border" />
                      <button
                        type="button" onClick={() => removePhoto(idx)}
                        className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center shadow"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {submitError && <p className="text-[10px] text-destructive">{submitError}</p>}
            {submitOk && (
              <p className="text-[10px] text-green-600 font-medium">
                ✓ Arrival logged. WhatsApp notification sent to POCs.
              </p>
            )}

            <Button
              type="submit" disabled={submitting}
              className="w-full sm:w-auto sm:self-start gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Package size={12} />}
              {submitting ? 'Logging…' : 'Log Arrival'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Arrivals log table */}
      <Card className="gap-0 py-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold">All Arrivals Log</span>
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            {sortedPackets.length} / {allPackets.length}
          </Badge>
          <button
            onClick={loadLog}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Refresh"
          >
            <RefreshCw size={13} className={loadingLog ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Search + filter bar */}
        <div className="px-4 py-3 border-b border-border flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-0">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="Search team…" className="h-9 pl-8 text-sm w-full" />
              {logSearch && (
                <button onClick={() => setLogSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowLogFilter(v => !v)}
              className={`flex items-center gap-1.5 h-9 px-3 text-xs border rounded transition-colors shrink-0 ${
                showLogFilter || logActiveFilters > 0
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground'
              }`}
            >
              <SlidersHorizontal size={12} />
              Filters
              {logActiveFilters > 0 && (
                <span className="bg-background text-foreground rounded-full px-1.5 text-[10px] font-bold leading-none py-0.5">
                  {logActiveFilters}
                </span>
              )}
            </button>
            {logActiveFilters > 0 && (
              <button
                onClick={() => { setLogSearch(''); setLogStatus('all'); setLogFrom(''); setLogTo('') }}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 shrink-0"
              >
                <X size={12} /> Clear
              </button>
            )}
            <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
              {sortedPackets.length} / {allPackets.length} rows
            </span>
          </div>
          {showLogFilter && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/50">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Status</label>
                <select
                  value={logStatus} onChange={e => setLogStatus(e.target.value)}
                  className="w-full h-10 border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring rounded"
                >
                  <option value="all">All Statuses</option>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">From Date</label>
                <Input type="date" value={logFrom} onChange={e => setLogFrom(e.target.value)} className="h-10 text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">To Date</label>
                <Input type="date" value={logTo} onChange={e => setLogTo(e.target.value)} className="h-10 text-sm" />
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
                  <th
                    className="px-3 py-2.5 font-semibold text-muted-foreground whitespace-nowrap cursor-pointer select-none hover:text-foreground"
                    onClick={() => setSortDesc(d => !d)}
                  >
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
