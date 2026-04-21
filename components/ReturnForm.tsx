'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ReturnFormProps {
  onSuccess: () => void
}

export default function ReturnForm({ onSuccess }: ReturnFormProps) {
  const [team, setTeam] = useState('')
  const [quantity, setQuantity] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!team.trim() || !quantity || !date) { setError('All fields required.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: team.trim(), quantity: Number(quantity), date }),
      })
      if (!res.ok) throw new Error()
      setTeam(''); setQuantity('')
      onSuccess()
    } catch {
      setError('Failed to record. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-label block mb-1">Team *</label>
          <Input value={team} onChange={e => setTeam(e.target.value)} placeholder="e.g. Alpha" />
        </div>
        <div>
          <label className="text-label block mb-1">Quantity *</label>
          <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="10" min={1} />
        </div>
        <div>
          <label className="text-label block mb-1">Date *</label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-[10px] text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} variant="outline" className="w-full">
        {loading ? 'Recording…' : 'Record Return'}
      </Button>
    </form>
  )
}
