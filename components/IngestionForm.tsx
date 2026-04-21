'use client'

import { useState } from 'react'
import { CheckCircle, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/AuthProvider'
import type { SdPacket } from '@/lib/types'
import { apiUrl } from '@/lib/api'

interface IngestionFormProps {
  packet: SdPacket
  onSuccess: () => void
  onCancel: () => void
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function IngestionForm({ packet, onSuccess, onCancel }: IngestionFormProps) {
  const { user } = useAuth()

  const [teamName, setTeamName]           = useState(packet.team_name)
  const [industry, setIndustry]           = useState('')
  const [actualCount, setActualCount]     = useState(String(packet.sd_card_count))
  const [missingCount, setMissingCount]   = useState('0')
  const [extraCount, setExtraCount]       = useState('0')
  const [redCardsCount, setRedCardsCount] = useState('0')
  const [ingestedBy, setIngestedBy]       = useState(user?.name ?? '')
  const [deploymentDate, setDeploymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes]                 = useState('')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setError('')
    if (!industry.trim())     { setError('Industry is required.'); return }
    if (!ingestedBy.trim())   { setError('Ingested By is required.'); return }
    if (!deploymentDate)      { setError('Deployment date is required.'); return }

    setLoading(true)
    try {
      const res = await fetch(apiUrl(`/api/packets/${packet.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:          'complete',
          team_name:       teamName.trim(),
          industry:        industry.trim(),
          actual_count:    Number(actualCount) || 0,
          missing_count:   Number(missingCount) || 0,
          extra_count:     Number(extraCount) || 0,
          red_cards_count: Number(redCardsCount) || 0,
          ingested_by:     ingestedBy.trim(),
          deployment_date: deploymentDate,
          notes:           notes.trim() || null,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to complete ingestion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-green-200/70 bg-green-50/30 gap-0 py-0">
      <CardHeader className="py-3 border-b border-border">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-600" />
            Complete Ingestion — Packet #{packet.id}
          </span>
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </CardTitle>
      </CardHeader>

      <CardContent className="py-4">
        {/* Packet summary */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px] text-muted-foreground mb-4 pb-3 border-b border-border">
          <span><strong className="text-foreground">Team:</strong> {packet.team_name}</span>
          <span><strong className="text-foreground">Factory:</strong> {packet.factory}</span>
          <span><strong className="text-foreground">Received:</strong> {formatDate(packet.date_received)}</span>
          <span><strong className="text-foreground">Submitted Count:</strong> {packet.sd_card_count}</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Team Name + Industry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-label block mb-1">Team Name *</label>
              <Input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Team name" />
            </div>
            <div>
              <label className="text-label block mb-1">Industry *</label>
              <Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Manufacturing, Retail…" />
            </div>
          </div>

          {/* Card Counts */}
          <div>
            <label className="text-label block mb-2">Card Counts</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Actual Count *', value: actualCount, set: setActualCount, highlight: 'border-foreground bg-muted/50' },
                { label: 'Missing Cards',  value: missingCount, set: setMissingCount, highlight: missingCount !== '0' ? 'border-red-400 bg-red-50' : '' },
                { label: 'Extra Cards',    value: extraCount,   set: setExtraCount,   highlight: extraCount !== '0' ? 'border-amber-400 bg-amber-50' : '' },
                { label: 'Red Cards',      value: redCardsCount, set: setRedCardsCount, highlight: redCardsCount !== '0' ? 'border-red-500 bg-red-50' : '' },
              ].map(({ label, value, set, highlight }) => (
                <div key={label} className={`border p-2 flex flex-col gap-1 transition-colors ${highlight || 'border-border'}`}>
                  <label className="text-label text-[9px]">{label}</label>
                  <input
                    type="number" min={0} value={value}
                    onChange={e => set(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold tabular-nums focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Ingested By + Deployment Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-label block mb-1">Ingested By *</label>
              <Input value={ingestedBy} onChange={e => setIngestedBy(e.target.value)} placeholder="Person's name" />
            </div>
            <div>
              <label className="text-label block mb-1">Deployment Date *</label>
              <Input type="date" value={deploymentDate} onChange={e => setDeploymentDate(e.target.value)} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-label block mb-1">Notes</label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" />
          </div>

          {error && <p className="text-[10px] text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle size={12} />
              {loading ? 'Saving…' : 'Mark Ingestion Complete'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>

        </form>
      </CardContent>
    </Card>
  )
}
