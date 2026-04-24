'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Package, X, Plus, Clock, CheckCircle2, Loader2, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/AuthProvider'
import { apiUrl } from '@/lib/api'

interface TeamInfo { name: string; poc_emails: string; poc_phones: string }

interface SdPacket {
  id: number
  team_name: string
  date_received: string
  status: string
  poc_phones: string
  created_at: string
}

function timeSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function fmtDate(d: string) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}

// ── Event 2 modal ─────────────────────────────────────────────────────────────
function CountRepackModal({
  packet,
  onClose,
  onSuccess,
}: {
  packet: SdPacket
  onClose: () => void
  onSuccess: () => void
}) {
  const { user } = useAuth()
  const [sdCardCount, setSdCardCount] = useState('')
  const [conditionNotes, setConditionNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!sdCardCount || Number(sdCardCount) <= 0) {
      setError('Enter the SD card count.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(apiUrl(`/api/packets/${packet.id}/events`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'counted_and_repacked',
          event_data: {
            sd_card_count:   Number(sdCardCount),
            condition_notes: conditionNotes.trim() || null,
            counted_by:      user?.name ?? 'Logistics',
          },
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-xs font-semibold">🔢 Count & Repack</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {packet.team_name} · received {fmtDate(packet.date_received)}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          <div>
            <label className="text-label block mb-1">SD Card Count *</label>
            <Input
              type="number" min={1}
              value={sdCardCount}
              onChange={e => setSdCardCount(e.target.value)}
              placeholder="e.g. 90"
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Total number of SD cards counted in this packet.
            </p>
          </div>

          <div>
            <label className="text-label block mb-1">Condition Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
            <textarea
              value={conditionNotes}
              onChange={e => setConditionNotes(e.target.value)}
              placeholder="Any notes about card condition, damaged cards, etc."
              rows={3}
              className="w-full text-sm border border-input bg-background rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {error && <p className="text-[10px] text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit" size="sm" disabled={loading}
              className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              {loading ? 'Saving…' : 'Mark as Counted & Repacked'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main LogisticsDashboard ───────────────────────────────────────────────────
export default function LogisticsDashboard() {
  const { user } = useAuth()

  // ── Event 1 form state ────────────────────────────────────────────────────
  const [allTeams, setAllTeams]         = useState<TeamInfo[]>([])
  const [teamInput, setTeamInput]       = useState('')
  const [suggestions, setSuggestions]   = useState<TeamInfo[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10))
  const [pocPhones, setPocPhones]       = useState('')
  const [phoneInput, setPhoneInput]     = useState('')

  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitOk, setSubmitOk]       = useState(false)

  // ── Event 2 state ─────────────────────────────────────────────────────────
  const [pending, setPending]       = useState<SdPacket[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [selectedPacket, setSelectedPacket] = useState<SdPacket | null>(null)

  // ── Load teams ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(apiUrl('/api/teams'))
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAllTeams(d) })
      .catch(() => {})
  }, [])

  // ── Autocomplete ──────────────────────────────────────────────────────────
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

  // ── Load pending packets ──────────────────────────────────────────────────
  const loadPending = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch(apiUrl('/api/packets?status=received_at_hq'), { cache: 'no-store' })
      const d = await res.json()
      if (Array.isArray(d)) setPending(d)
    } catch { /* ignore */ }
    finally { setLoadingList(false) }
  }, [])

  useEffect(() => { loadPending() }, [loadPending])

  // ── Submit Event 1 ────────────────────────────────────────────────────────
  const handleLogArrival = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    if (!teamInput.trim()) { setSubmitError('Team name is required.'); return }

    setSubmitting(true)
    try {
      const res = await fetch(apiUrl('/api/packets'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name:     teamInput.trim(),
          received_date: receivedDate,
          poc_phones:    pocPhones,
          entered_by:    user?.name ?? 'Logistics',
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }

      // Reset form
      setTeamInput(''); setPocPhones(''); setPhoneInput('')
      setReceivedDate(new Date().toISOString().slice(0, 10))
      setSubmitOk(true)
      setTimeout(() => setSubmitOk(false), 4000)
      loadPending()
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Section 1: Log New Arrival ───────────────────────────────────── */}
      <Card className="py-4 gap-0 border-blue-200/60 bg-blue-50/30">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Package size={14} className="text-blue-600" />
            Log New Arrival
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleLogArrival} className="flex flex-col gap-4">

            {/* Team autocomplete */}
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
                      <button key={s.name} type="button"
                        className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                        onMouseDown={() => selectTeam(s)}>
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
                    <span key={phone}
                      className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full font-medium">
                      {phone}
                      <button type="button" onClick={() => removePhone(phone)}
                        className="hover:text-red-600 transition-colors ml-0.5">
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
              {submitting
                ? <Loader2 size={12} className="animate-spin" />
                : <Package size={12} />}
              {submitting ? 'Logging…' : 'Log Arrival'}
            </Button>

          </form>
        </CardContent>
      </Card>

      {/* ── Section 2: Pending Count & Repack ───────────────────────────────── */}
      <Card className="py-4 gap-0 border-amber-200/60 bg-amber-50/20">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock size={14} className="text-amber-600" />
            Pending Count &amp; Repack
            {pending.length > 0 && (
              <Badge variant="outline" className="ml-1 text-amber-700 border-amber-300 bg-amber-50 text-[10px]">
                {pending.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          {loadingList ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
              <Loader2 size={12} className="animate-spin" /> Loading…
            </div>
          ) : pending.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 size={28} className="mx-auto text-green-500 mb-2" />
              <p className="text-xs text-muted-foreground">All packets counted and repacked.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/50">
              {pending.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPacket(p)}
                  className="flex items-center gap-3 py-3 px-1 text-left hover:bg-muted/40 transition-colors rounded group"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{p.team_name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Received {fmtDate(p.date_received)}
                      <span className="mx-1.5 text-border">·</span>
                      <span className="text-amber-600">{timeSince(p.created_at)}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-blue-600 group-hover:underline flex items-center gap-0.5 shrink-0">
                    Count &amp; Repack <ChevronRight size={11} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Event 2 modal ───────────────────────────────────────────────────── */}
      {selectedPacket && (
        <CountRepackModal
          packet={selectedPacket}
          onClose={() => setSelectedPacket(null)}
          onSuccess={loadPending}
        />
      )}
    </div>
  )
}
