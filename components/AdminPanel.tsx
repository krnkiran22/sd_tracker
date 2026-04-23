'use client'

import { useState, useEffect, useCallback } from 'react'
import { Pencil, Trash2, Check, X, Loader2, RefreshCw, ShieldAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiUrl } from '@/lib/api'
import type { SdPacket, IngestionRecord } from '@/lib/types'

type Tab = 'packets' | 'ingestion' | 'teams' | 'users'

interface Team { name: string; poc_emails: string; poc_phones: string }
interface AppUser { id: number; name: string; email: string; role: string; is_verified: boolean; created_at: string }

function fmt(d: string) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}

// ── Generic confirm-delete button ─────────────────────────────────────────────
function DeleteBtn({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
  const [confirm, setConfirm] = useState(false)
  if (confirm) return (
    <span className="inline-flex gap-1">
      <button onClick={onConfirm} disabled={disabled}
        className="text-[10px] text-red-600 font-semibold hover:underline disabled:opacity-50">Yes, delete</button>
      <button onClick={() => setConfirm(false)}
        className="text-[10px] text-muted-foreground hover:underline">Cancel</button>
    </span>
  )
  return (
    <button onClick={() => setConfirm(true)} disabled={disabled}
      className="text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50">
      <Trash2 size={13} />
    </button>
  )
}

// ── SD Packets table ──────────────────────────────────────────────────────────
function PacketsAdmin() {
  const [rows, setRows]       = useState<SdPacket[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft]     = useState<Partial<SdPacket>>({})
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(apiUrl('/api/packets'), { cache: 'no-store' })
      const d = await r.json()
      if (Array.isArray(d)) setRows(d)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const startEdit = (row: SdPacket) => { setEditing(row.id); setDraft({ ...row }) }
  const cancelEdit = () => { setEditing(null); setDraft({}) }

  const save = async (id: number) => {
    setSaving(true)
    try {
      await fetch(apiUrl(`/api/packets/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      await load()
      setEditing(null)
    } finally { setSaving(false) }
  }

  const del = async (id: number) => {
    await fetch(apiUrl(`/api/packets/${id}`), { method: 'DELETE' })
    await load()
  }

  const field = (key: keyof SdPacket, type = 'text') => (
    <Input
      type={type} value={(draft as any)[key] ?? ''}
      onChange={e => setDraft(d => ({ ...d, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
      className="h-6 text-[11px] px-1.5 py-0 min-w-[80px]"
    />
  )

  if (loading) return <div className="flex items-center gap-2 text-xs text-muted-foreground py-6"><Loader2 size={12} className="animate-spin" /> Loading…</div>

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-muted-foreground">{rows.length} packets</span>
        <button onClick={load} className="text-muted-foreground hover:text-foreground"><RefreshCw size={11} /></button>
      </div>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            {['#', 'Team', 'Factory', 'Date', 'Count', 'Status', 'POC Emails', 'Entered By', 'Notes', ''].map(h => (
              <th key={h} className="pb-2 pr-3 font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const isEditing = editing === row.id
            return (
              <tr key={row.id} className={`border-b border-border/50 last:border-0 ${isEditing ? 'bg-amber-50/50' : 'hover:bg-muted/30'} transition-colors`}>
                <td className="py-1.5 pr-3 font-mono text-muted-foreground">{row.id}</td>
                <td className="py-1.5 pr-3">{isEditing ? field('team_name') : <span className="font-medium">{row.team_name}</span>}</td>
                <td className="py-1.5 pr-3">{isEditing ? field('factory') : row.factory}</td>
                <td className="py-1.5 pr-3 whitespace-nowrap">{isEditing ? field('date_received', 'date') : fmt(row.date_received)}</td>
                <td className="py-1.5 pr-3">{isEditing ? field('sd_card_count', 'number') : <span className="font-semibold">{row.sd_card_count}</span>}</td>
                <td className="py-1.5 pr-3">
                  {isEditing ? (
                    <select value={(draft as any).status ?? row.status}
                      onChange={e => setDraft(d => ({ ...d, status: e.target.value as any }))}
                      className="border border-border rounded text-[11px] px-1 py-0.5 bg-background">
                      <option value="received">received</option>
                      <option value="processing">processing</option>
                      <option value="completed">completed</option>
                    </select>
                  ) : (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      row.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                      row.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {row.status}
                    </span>
                  )}
                </td>
                <td className="py-1.5 pr-3 max-w-[160px]">{isEditing ? field('poc_emails') : <span className="truncate block text-muted-foreground" title={row.poc_emails}>{row.poc_emails || '—'}</span>}</td>
                <td className="py-1.5 pr-3">{isEditing ? field('entered_by') : row.entered_by}</td>
                <td className="py-1.5 pr-3">{isEditing ? field('notes') : <span className="text-muted-foreground">{row.notes || '—'}</span>}</td>
                <td className="py-1.5">
                  {isEditing ? (
                    <span className="flex gap-1.5">
                      <button onClick={() => save(row.id)} disabled={saving}
                        className="text-green-600 hover:text-green-700 disabled:opacity-50"><Check size={13} /></button>
                      <button onClick={cancelEdit}
                        className="text-muted-foreground hover:text-foreground"><X size={13} /></button>
                    </span>
                  ) : (
                    <span className="flex gap-1.5">
                      <button onClick={() => startEdit(row)}
                        className="text-muted-foreground hover:text-blue-500 transition-colors"><Pencil size={12} /></button>
                      <DeleteBtn onConfirm={() => del(row.id)} />
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Ingestion Records table ───────────────────────────────────────────────────
function IngestionAdmin() {
  const [rows, setRows]       = useState<IngestionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft]     = useState<Partial<IngestionRecord>>({})
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(apiUrl('/api/admin/ingestion-records'), { cache: 'no-store' })
      const d = await r.json()
      if (Array.isArray(d)) setRows(d)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const save = async (id: number) => {
    setSaving(true)
    try {
      await fetch(apiUrl(`/api/admin/ingestion-records/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      await load(); setEditing(null)
    } finally { setSaving(false) }
  }

  const del = async (id: number) => {
    await fetch(apiUrl(`/api/admin/ingestion-records/${id}`), { method: 'DELETE' })
    await load()
  }

  const field = (key: keyof IngestionRecord, type = 'text') => (
    <Input type={type} value={(draft as any)[key] ?? ''}
      onChange={e => setDraft(d => ({ ...d, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
      className="h-6 text-[11px] px-1.5 py-0 min-w-[70px]" />
  )

  if (loading) return <div className="flex items-center gap-2 text-xs text-muted-foreground py-6"><Loader2 size={12} className="animate-spin" /> Loading…</div>

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-muted-foreground">{rows.length} records</span>
        <button onClick={load} className="text-muted-foreground hover:text-foreground"><RefreshCw size={11} /></button>
      </div>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            {['#', 'Pkt', 'Team', 'Industry', 'Actual', 'Missing', 'Extra', 'Red', 'Deploy Date', 'Ingested By', 'Notes', ''].map(h => (
              <th key={h} className="pb-2 pr-3 font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const isEditing = editing === row.id
            return (
              <tr key={row.id} className={`border-b border-border/50 last:border-0 ${isEditing ? 'bg-amber-50/50' : 'hover:bg-muted/30'}`}>
                <td className="py-1.5 pr-3 font-mono text-muted-foreground">{row.id}</td>
                <td className="py-1.5 pr-3 font-mono text-muted-foreground">{row.packet_id}</td>
                <td className="py-1.5 pr-3">{isEditing ? field('team_name') : <span className="font-medium">{row.team_name}</span>}</td>
                <td className="py-1.5 pr-3">{isEditing ? field('industry') : row.industry}</td>
                <td className="py-1.5 pr-3">{isEditing ? field('actual_count', 'number') : <span className="font-semibold text-green-700">{row.actual_count}</span>}</td>
                <td className="py-1.5 pr-3">{isEditing ? field('missing_count', 'number') : <span className={row.missing_count > 0 ? 'text-red-600 font-semibold' : ''}>{row.missing_count}</span>}</td>
                <td className="py-1.5 pr-3">{isEditing ? field('extra_count', 'number') : row.extra_count}</td>
                <td className="py-1.5 pr-3">{isEditing ? field('red_cards_count', 'number') : <span className={row.red_cards_count > 0 ? 'text-red-600 font-semibold' : ''}>{row.red_cards_count}</span>}</td>
                <td className="py-1.5 pr-3 whitespace-nowrap">{isEditing ? field('deployment_date', 'date') : fmt(row.deployment_date)}</td>
                <td className="py-1.5 pr-3">{isEditing ? field('ingested_by') : row.ingested_by}</td>
                <td className="py-1.5 pr-3">{isEditing ? field('notes') : <span className="text-muted-foreground">{row.notes || '—'}</span>}</td>
                <td className="py-1.5">
                  {isEditing ? (
                    <span className="flex gap-1.5">
                      <button onClick={() => save(row.id)} disabled={saving} className="text-green-600 hover:text-green-700 disabled:opacity-50"><Check size={13} /></button>
                      <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X size={13} /></button>
                    </span>
                  ) : (
                    <span className="flex gap-1.5">
                      <button onClick={() => { setEditing(row.id); setDraft({ ...row }) }} className="text-muted-foreground hover:text-blue-500"><Pencil size={12} /></button>
                      <DeleteBtn onConfirm={() => del(row.id)} />
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Teams table ───────────────────────────────────────────────────────────────
function TeamsAdmin() {
  const [rows, setRows]       = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft]     = useState<Team>({ name: '', poc_emails: '', poc_phones: '' })
  const [saving, setSaving]   = useState(false)
  const [newRow, setNewRow]   = useState(false)
  const [newDraft, setNewDraft] = useState<Team>({ name: '', poc_emails: '', poc_phones: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(apiUrl('/api/teams'), { cache: 'no-store' })
      const d = await r.json()
      if (Array.isArray(d)) setRows(d)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const save = async (oldName: string) => {
    setSaving(true)
    try {
      await fetch(apiUrl(`/api/teams/${encodeURIComponent(oldName)}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      await load(); setEditing(null)
    } finally { setSaving(false) }
  }

  const del = async (name: string) => {
    await fetch(apiUrl(`/api/teams/${encodeURIComponent(name)}`), { method: 'DELETE' })
    await load()
  }

  const addNew = async () => {
    if (!newDraft.name.trim()) return
    setSaving(true)
    try {
      await fetch(apiUrl('/api/teams'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDraft),
      })
      setNewRow(false); setNewDraft({ name: '', poc_emails: '', poc_phones: '' })
      await load()
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center gap-2 text-xs text-muted-foreground py-6"><Loader2 size={12} className="animate-spin" /> Loading…</div>

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-muted-foreground">{rows.length} teams</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setNewRow(v => !v)}
            className="text-[11px] text-blue-600 hover:underline font-medium">+ Add Team</button>
          <button onClick={load} className="text-muted-foreground hover:text-foreground"><RefreshCw size={11} /></button>
        </div>
      </div>

      {newRow && (
        <div className="flex gap-2 mb-3 p-2 bg-blue-50/50 border border-blue-200 rounded items-center flex-wrap">
          <Input placeholder="Team name" value={newDraft.name}
            onChange={e => setNewDraft(d => ({ ...d, name: e.target.value }))}
            className="h-7 text-[11px] flex-1 min-w-[120px]" />
          <Input placeholder="POC emails (comma-separated)" value={newDraft.poc_emails}
            onChange={e => setNewDraft(d => ({ ...d, poc_emails: e.target.value }))}
            className="h-7 text-[11px] flex-[2] min-w-[160px]" />
          <Input placeholder="WhatsApp numbers e.g. +919876543210" value={newDraft.poc_phones}
            onChange={e => setNewDraft(d => ({ ...d, poc_phones: e.target.value }))}
            className="h-7 text-[11px] flex-[2] min-w-[160px]" />
          <Button size="sm" onClick={addNew} disabled={saving} className="h-7 text-[11px]">Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setNewRow(false)} className="h-7 text-[11px]">Cancel</Button>
        </div>
      )}

      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            {['Team Name', 'POC Emails', 'WhatsApp Numbers', ''].map(h => (
              <th key={h} className="pb-2 pr-4 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const isEditing = editing === row.name
            return (
              <tr key={row.name} className={`border-b border-border/50 last:border-0 ${isEditing ? 'bg-amber-50/50' : 'hover:bg-muted/30'}`}>
                <td className="py-1.5 pr-4">
                  {isEditing
                    ? <Input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} className="h-6 text-[11px] px-1.5 py-0 w-48" />
                    : <span className="font-medium">{row.name}</span>}
                </td>
                <td className="py-1.5 pr-4">
                  {isEditing
                    ? <Input value={draft.poc_emails} onChange={e => setDraft(d => ({ ...d, poc_emails: e.target.value }))} className="h-6 text-[11px] px-1.5 py-0 w-48" placeholder="email1@x.com, email2@x.com" />
                    : <span className="text-muted-foreground">{row.poc_emails || '—'}</span>}
                </td>
                <td className="py-1.5 pr-4 w-full">
                  {isEditing
                    ? <Input value={draft.poc_phones} onChange={e => setDraft(d => ({ ...d, poc_phones: e.target.value }))} className="h-6 text-[11px] px-1.5 py-0 w-full" placeholder="+919876543210, +918765432109" />
                    : <span className="text-green-700">{row.poc_phones || '—'}</span>}
                </td>
                <td className="py-1.5">
                  {isEditing ? (
                    <span className="flex gap-1.5">
                      <button onClick={() => save(row.name)} disabled={saving} className="text-green-600 hover:text-green-700 disabled:opacity-50"><Check size={13} /></button>
                      <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X size={13} /></button>
                    </span>
                  ) : (
                    <span className="flex gap-1.5">
                      <button onClick={() => { setEditing(row.name); setDraft({ ...row }) }} className="text-muted-foreground hover:text-blue-500"><Pencil size={12} /></button>
                      <DeleteBtn onConfirm={() => del(row.name)} />
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Users table ───────────────────────────────────────────────────────────────
function UsersAdmin() {
  const [rows, setRows]       = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft]     = useState<Partial<AppUser>>({})
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(apiUrl('/api/admin/users'), { cache: 'no-store' })
      const d = await r.json()
      if (Array.isArray(d)) setRows(d)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const save = async (id: number) => {
    setSaving(true)
    try {
      await fetch(apiUrl(`/api/admin/users/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: draft.role }),
      })
      await load(); setEditing(null)
    } finally { setSaving(false) }
  }

  const del = async (id: number) => {
    await fetch(apiUrl(`/api/admin/users/${id}`), { method: 'DELETE' })
    await load()
  }

  const roleBadge: Record<string, string> = {
    admin:     'bg-purple-100 text-purple-700 border-purple-200',
    logistics: 'bg-blue-100 text-blue-700 border-blue-200',
    ingestion: 'bg-green-100 text-green-700 border-green-200',
    user:      'bg-gray-100 text-gray-600 border-gray-200',
  }

  if (loading) return <div className="flex items-center gap-2 text-xs text-muted-foreground py-6"><Loader2 size={12} className="animate-spin" /> Loading…</div>

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-muted-foreground">{rows.length} users</span>
        <button onClick={load} className="text-muted-foreground hover:text-foreground"><RefreshCw size={11} /></button>
      </div>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            {['#', 'Name', 'Email', 'Role', 'Verified', 'Joined', ''].map(h => (
              <th key={h} className="pb-2 pr-4 font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const isEditing = editing === row.id
            return (
              <tr key={row.id} className={`border-b border-border/50 last:border-0 ${isEditing ? 'bg-amber-50/50' : 'hover:bg-muted/30'}`}>
                <td className="py-1.5 pr-4 font-mono text-muted-foreground">{row.id}</td>
                <td className="py-1.5 pr-4 font-medium">{row.name}</td>
                <td className="py-1.5 pr-4 text-muted-foreground">{row.email}</td>
                <td className="py-1.5 pr-4">
                  {isEditing ? (
                    <select value={(draft as any).role ?? row.role}
                      onChange={e => setDraft(d => ({ ...d, role: e.target.value }))}
                      className="border border-border rounded text-[11px] px-1 py-0.5 bg-background">
                      {['logistics', 'ingestion', 'admin', 'user'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${roleBadge[row.role] ?? ''}`}>
                      {row.role}
                    </span>
                  )}
                </td>
                <td className="py-1.5 pr-4">
                  <Badge variant="outline" className={`text-[10px] ${row.is_verified ? 'text-green-700 border-green-300' : 'text-amber-700 border-amber-300'}`}>
                    {row.is_verified ? '✓ Yes' : '✗ No'}
                  </Badge>
                </td>
                <td className="py-1.5 pr-4 whitespace-nowrap text-muted-foreground">{fmt(row.created_at)}</td>
                <td className="py-1.5">
                  {isEditing ? (
                    <span className="flex gap-1.5">
                      <button onClick={() => save(row.id)} disabled={saving} className="text-green-600 hover:text-green-700 disabled:opacity-50"><Check size={13} /></button>
                      <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X size={13} /></button>
                    </span>
                  ) : (
                    <span className="flex gap-1.5">
                      <button onClick={() => { setEditing(row.id); setDraft({ ...row }) }} className="text-muted-foreground hover:text-blue-500"><Pencil size={12} /></button>
                      <DeleteBtn onConfirm={() => del(row.id)} />
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Main AdminPanel ───────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('packets')

  const tabs: { key: Tab; label: string; color: string }[] = [
    { key: 'packets',   label: 'SD Packets',        color: 'text-blue-700 border-blue-300 bg-blue-50' },
    { key: 'ingestion', label: 'Ingestion Records',  color: 'text-green-700 border-green-300 bg-green-50' },
    { key: 'teams',     label: 'Teams',              color: 'text-violet-700 border-violet-300 bg-violet-50' },
    { key: 'users',     label: 'Users',              color: 'text-orange-700 border-orange-300 bg-orange-50' },
  ]

  return (
    <Card className="gap-0 py-0 border-red-200/60">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 flex-wrap">
        <ShieldAlert size={14} className="text-red-500" />
        <span className="text-xs font-semibold">Admin Panel</span>
        <span className="text-border">·</span>
        <span className="text-[10px] text-muted-foreground">Full CRUD access to all tables</span>
        <div className="ml-auto flex items-center gap-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded border transition-colors ${
                tab === t.key ? t.color : 'text-muted-foreground border-transparent hover:bg-muted'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <CardContent className="py-4">
        {tab === 'packets'   && <PacketsAdmin />}
        {tab === 'ingestion' && <IngestionAdmin />}
        {tab === 'teams'     && <TeamsAdmin />}
        {tab === 'users'     && <UsersAdmin />}
      </CardContent>
    </Card>
  )
}
