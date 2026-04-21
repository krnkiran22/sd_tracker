'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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

  if (!records.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <span className="text-xs">No transactions yet. Use the form above to record one.</span>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-label text-left py-2 pr-3 font-normal">Team</th>
              <th className="text-label text-left py-2 pr-3 font-normal">Date</th>
              <th className="text-label text-left py-2 pr-3 font-normal">Type</th>
              {ITEMS.map(i => (
                <th key={i.key} className="text-label text-right py-2 pr-3 font-normal">{i.label}</th>
              ))}
              <th className="text-label text-left py-2 pr-3 font-normal">Notes</th>
              <th className="text-label text-left py-2 pr-3 font-normal">By</th>
              <th className="text-label py-2 pr-1 font-normal w-16"></th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <>
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                  <td className="py-2 pr-3 font-medium">{r.team_name}</td>
                  <td className="py-2 pr-3 text-muted-foreground font-mono">{String(r.date).slice(0, 10)}</td>
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
                  <td className="py-2 pr-3 text-muted-foreground max-w-[120px] truncate">
                    {r.notes || (r.other_description ? `Other: ${r.other_description}` : '—')}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground text-[10px]">
                    {r.entered_by || '—'}
                  </td>

                  {/* Action buttons */}
                  <td className="py-2 pr-1">
                    <div className="flex items-center gap-1 justify-end">
                      {/* Expand (only if has photo/details) */}
                      {(r.photo_url || r.other_description || r.notes) && (
                        <button onClick={() => setExpandedId(expandedId === r.id ? null : (r.id ?? null))}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded"
                          title="Show details">
                          {expandedId === r.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>
                      )}
                      {/* Edit — admin only */}
                      {canEdit && (
                        <button onClick={() => setEditingTx(r)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded"
                          title="Edit transaction">
                          <Pencil size={11} />
                        </button>
                      )}
                      {/* Delete — admin only */}
                      {canDelete && (
                        confirmId === r.id ? (
                          <span className="flex items-center gap-1">
                            <button onClick={() => handleDelete(r.id!)}
                              disabled={deletingId === r.id}
                              className="text-[10px] text-destructive font-semibold hover:underline disabled:opacity-50">
                              {deletingId === r.id ? '…' : 'Yes'}
                            </button>
                            <button onClick={() => setConfirmId(null)}
                              className="text-[10px] text-muted-foreground hover:underline">
                              No
                            </button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmId(r.id ?? null)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1 hover:bg-muted rounded"
                            title="Delete transaction">
                            <Trash2 size={11} />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>

                {/* Expanded row */}
                {expandedId === r.id && (
                  <tr key={`${r.id}-exp`} className="bg-muted/30 border-b border-border/50">
                    <td colSpan={ITEMS.length + 5} className="px-4 py-3">
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
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

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
