'use client'

import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ITEMS } from '@/lib/items'
import type { Transaction } from '@/lib/items'
import { apiUrl } from '@/lib/api'

type ItemKey = 'devices' | 'sd_cards' | 'hubs' | 'cables' | 'extension_boxes' | 'sd_card_readers' | 'other'

interface Props {
  transaction: Transaction
  onClose: () => void
  onSaved: () => void
}

export default function EditTransactionModal({ transaction, onClose, onSaved }: Props) {
  const [teamName, setTeamName]   = useState(transaction.team_name)
  const [type, setType]           = useState<'sent' | 'received'>(transaction.type)
  const [date, setDate]           = useState(String(transaction.date).slice(0, 10))
  const [items, setItems]         = useState<Record<ItemKey, number>>({
    devices:          transaction.devices          ?? 0,
    sd_cards:         transaction.sd_cards         ?? 0,
    hubs:             transaction.hubs             ?? 0,
    cables:           transaction.cables           ?? 0,
    extension_boxes:  transaction.extension_boxes  ?? 0,
    sd_card_readers:  transaction.sd_card_readers  ?? 0,
    other:            transaction.other            ?? 0,
  })
  const [otherDesc, setOtherDesc] = useState(transaction.other_description ?? '')
  const [notes, setNotes]         = useState(transaction.notes ?? '')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const setItem = (key: ItemKey, val: number) =>
    setItems(prev => ({ ...prev, [key]: Math.max(0, val) }))

  const handleSave = async () => {
    setError('')
    if (!teamName.trim()) { setError('Team name is required.'); return }

    setLoading(true)
    try {
      const res = await fetch(apiUrl(`/api/transactions/${transaction.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name:        teamName.trim(),
          type,
          date,
          ...items,
          other_description: otherDesc,
          notes,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div className="relative bg-card border border-border shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <span className="text-xs font-semibold">Edit Transaction</span>
            <span className="ml-2 text-[10px] text-muted-foreground">ID #{transaction.id}</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 flex flex-col gap-4">

          {/* Type toggle */}
          <div className="flex border border-border self-start">
            {(['sent', 'received'] as const).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  type === t ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'
                }`}>
                {t === 'sent' ? '↑ Sent' : '↓ Received'}
              </button>
            ))}
          </div>

          {/* Team + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-label block mb-1">Team Name *</label>
              <Input value={teamName} onChange={e => setTeamName(e.target.value)} />
            </div>
            <div>
              <label className="text-label block mb-1">Date *</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          {/* Items */}
          <div>
            <label className="text-label block mb-2">Items</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ITEMS.map(item => (
                <div key={item.key}
                  className={`border p-2 flex flex-col gap-1 transition-colors ${
                    items[item.key as ItemKey] > 0 ? 'border-foreground bg-muted/50' : 'border-border'
                  }`}>
                  <label className="text-label">{item.label}</label>
                  <input
                    type="number" min={0}
                    value={items[item.key as ItemKey] || ''}
                    placeholder="0"
                    onChange={e => setItem(item.key as ItemKey, Number(e.target.value))}
                    className="w-full bg-transparent text-sm font-semibold tabular-nums focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Other description */}
          {items.other > 0 && (
            <div>
              <label className="text-label block mb-1">Other — Description</label>
              <Input value={otherDesc} onChange={e => setOtherDesc(e.target.value)} placeholder="Describe the other items…" />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-label block mb-1">Notes</label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" />
          </div>

          {/* Error */}
          {error && <p className="text-[10px] text-destructive">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={loading} className="gap-1.5">
              <Save size={11} />
              {loading ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}
