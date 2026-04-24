'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Pencil, Trash2, Search, X, SlidersHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { Transaction } from '@/lib/items'
import { ITEMS } from '@/lib/items'
import EditTransactionModal from '@/components/EditTransactionModal'
import { apiUrl } from '@/lib/api'

interface Props {
  records: Transaction[]
  onEdited?: () => void
  canEdit?: boolean
  canDelete?: boolean
}

export default function RecordsTable({ records, onEdited, canEdit = false, canDelete = false }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editingTx, setEditingTx]   = useState<Transaction | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmId, setConfirmId]   = useState<number | null>(null)

  // ── Filter state ────────────────────────────────────────────────────────────
  const [search,      setSearch]      = useState('')
  const [typeFilter,  setTypeFilter]  = useState<'all' | 'sent' | 'received'>('all')
  const [handlerFilter, setHandlerFilter] = useState('')
  const [fromDate,    setFromDate]    = useState('')
  const [toDate,      setToDate]      = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // ── Derived unique handlers list ─────────────────────────────────────────────
  const handlers = useMemo(() => {
    const set = new Set(records.map(r => r.entered_by).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [records])

  // ── Filtered rows ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return records.filter(r => {
      if (search && !r.team_name.toLowerCase().includes(search.toLowerCase())) return false
      if (typeFilter !== 'all' && r.type !== typeFilter) return false
      if (handlerFilter && r.entered_by !== handlerFilter) return false
      const dateStr = String(r.date).slice(0, 10)
      if (fromDate && dateStr < fromDate) return false
      if (toDate   && dateStr > toDate)   return false
      return true
    })
  }, [records, search, typeFilter, handlerFilter, fromDate, toDate])

  const activeFilters = (search ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0) +
    (handlerFilter ? 1 : 0) + (fromDate ? 1 : 0) + (toDate ? 1 : 0)

  const clearFilters = () => {
    setSearch(''); setTypeFilter('all'); setHandlerFilter(''); setFromDate(''); setToDate('')
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await fetch(apiUrl(`/api/transactions/${id}`), { method: 'DELETE' })
      setConfirmId(null)
      onEdited?.()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {/* ── Filter bar ────────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-border flex flex-col gap-3">
        {/* Top row: search + filter toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-0">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search team…"
              className="h-9 pl-8 text-sm w-full"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                <X size={12} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 h-9 px-3 text-xs border rounded transition-colors shrink-0 ${
              showFilters || activeFilters > 0
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground'
            }`}>
            <SlidersHorizontal size={12} />
            Filters
            {activeFilters > 0 && (
              <span className="bg-background text-foreground rounded-full px-1.5 text-[10px] font-bold leading-none py-0.5">
                {activeFilters}
              </span>
            )}
          </button>

          {activeFilters > 0 && (
            <button onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 shrink-0">
              <X size={12} /> Clear
            </button>
          )}

          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
            {filtered.length} / {records.length} rows
          </span>
        </div>

        {/* Expanded filter panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border/50">
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as any)}
                className="w-full h-8 border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring rounded">
                <option value="all">All Types</option>
                <option value="sent">Sent</option>
                <option value="received">Received</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Event Handler</label>
              <select
                value={handlerFilter}
                onChange={e => setHandlerFilter(e.target.value)}
                className="w-full h-8 border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring rounded">
                <option value="">All Handlers</option>
                {handlers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">From Date</label>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">To Date</label>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
          <span className="text-xs">
            {records.length === 0
              ? 'No transactions yet. Use the form above to record one.'
              : 'No records match the current filters.'}
          </span>
          {activeFilters > 0 && (
            <button onClick={clearFilters} className="text-[10px] underline hover:text-foreground">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-label text-left py-2.5 px-4 font-medium">Team</th>
                <th className="text-label text-left py-2.5 pr-3 font-medium">Date</th>
                <th className="text-label text-left py-2.5 pr-3 font-medium">Type</th>
                <th className="text-label text-left py-2.5 pr-3 font-medium">Event Handler</th>
                {ITEMS.map(i => (
                  <th key={i.key} className="text-label text-right py-2.5 pr-3 font-medium">{i.label}</th>
                ))}
                <th className="text-label text-left py-2.5 pr-3 font-medium">Notes</th>
                <th className="text-label py-2.5 pr-3 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <>
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 px-4 font-medium">{r.team_name}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground font-mono">{String(r.date).slice(0, 10)}</td>
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
                      {r.notes || (r.other_description ? `Other: ${r.other_description}` : '—')}
                    </td>

                    {/* Action buttons */}
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-0.5 justify-end">
                        {(r.photo_url || r.other_description || r.notes) && (
                          <button onClick={() => setExpandedId(expandedId === r.id ? null : (r.id ?? null))}
                            className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title="Show details">
                            {expandedId === r.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        )}
                        {canEdit && (
                          <button onClick={() => setEditingTx(r)}
                            className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title="Edit transaction">
                            <Pencil size={13} />
                          </button>
                        )}
                        {canDelete && (
                          confirmId === r.id ? (
                            <span className="flex items-center gap-1">
                              <button onClick={() => handleDelete(r.id!)}
                                disabled={deletingId === r.id}
                                className="text-xs text-destructive font-semibold hover:underline disabled:opacity-50 px-1 py-2">
                                {deletingId === r.id ? '…' : 'Yes'}
                              </button>
                              <button onClick={() => setConfirmId(null)}
                                className="text-xs text-muted-foreground hover:underline px-1 py-2">
                                No
                              </button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmId(r.id ?? null)}
                              className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-muted rounded min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title="Delete transaction">
                              <Trash2 size={13} />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expandedId === r.id && (
                    <tr key={`${r.id}-exp`} className="bg-muted/30 border-b border-border/50">
                      <td colSpan={ITEMS.length + 5} className="px-4 py-4">
                        <div className="flex gap-6 flex-wrap">
                          {r.photo_url && (
                            <div>
                              <div className="text-label mb-1">Photo</div>
                              <img
                                src={r.photo_url}
                                alt="transaction"
                                className="max-h-48 max-w-[240px] w-auto border border-border object-contain rounded-sm"
                                style={{ display: 'block' }}
                              />
                            </div>
                          )}
                          {r.other_description && (
                            <div>
                              <div className="text-label mb-1">Other Description</div>
                              <div className="text-xs">{r.other_description}</div>
                            </div>
                          )}
                          {r.notes && (
                            <div>
                              <div className="text-label mb-1">Notes</div>
                              <div className="text-xs">{r.notes}</div>
                            </div>
                          )}
                          {r.entered_by && (
                            <div>
                              <div className="text-label mb-1">Event Handler</div>
                              <div className="text-xs font-medium">{r.entered_by}</div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
          onSaved={() => { setEditingTx(null); onEdited?.() }}
        />
      )}
    </>
  )
}
