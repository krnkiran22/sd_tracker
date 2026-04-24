'use client'

import { useState } from 'react'
import { CheckCircle, X, Package2, User, Factory, CalendarDays, FileText, UserCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SdPacket } from '@/lib/types'
import { apiUrl } from '@/lib/api'

interface ExtPacket extends SdPacket {
  assigned_to?: string | null
  deployment_date?: string | null
  num_packages?: number
}

interface IngestionFormProps {
  packet: ExtPacket
  onSuccess: () => void
  onCancel: () => void
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function IngestionForm({ packet, onSuccess, onCancel }: IngestionFormProps) {
  // Pre-fill ingested_by from assigned_to if available
  const defaultIngestedBy = packet.assigned_to ?? ''
  // Pre-fill deployment_date from packet if available
  const defaultDeployDate = packet.deployment_date
    ? packet.deployment_date.slice(0, 10)
    : new Date().toISOString().slice(0, 10)

  const [actualCount,    setActualCount]    = useState(String(packet.sd_card_count))
  const [missingCount,   setMissingCount]   = useState('0')
  const [redCardsCount,  setRedCardsCount]  = useState('0')
  const [ingestedBy,     setIngestedBy]     = useState(defaultIngestedBy)
  const [deploymentDate, setDeploymentDate] = useState(defaultDeployDate)
  const [notes,          setNotes]          = useState(packet.notes ?? '')
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setError('')
    if (!ingestedBy.trim())   { setError('Ingested By is required.'); return }
    if (!deploymentDate)      { setError('Deployment date is required.'); return }
    if (!actualCount || Number(actualCount) < 0) { setError('Enter the actual SD card count.'); return }

    setLoading(true)
    try {
      const res = await fetch(apiUrl(`/api/packets/${packet.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:          'complete',
          team_name:       packet.team_name,
          actual_count:    Number(actualCount)   || 0,
          missing_count:   Number(missingCount)  || 0,
          extra_count:     0,
          red_cards_count: Number(redCardsCount) || 0,
          ingested_by:     ingestedBy.trim(),
          deployment_date: deploymentDate,
          notes:           notes.trim() || null,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete ingestion.')
    } finally {
      setLoading(false)
    }
  }

  const missing = Number(missingCount) || 0
  const red     = Number(redCardsCount) || 0

  return (
    <Card className="border-green-200/70 bg-green-50/20 gap-0 py-0">
      <CardHeader className="py-3 px-4 border-b border-border">
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

      <CardContent className="py-4 px-4">

        {/* Packet summary — read-only */}
        <div className="bg-muted/40 rounded-lg p-3 mb-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
          <div className="flex items-center gap-1.5">
            <User size={11} className="text-muted-foreground" />
            <span className="text-muted-foreground">Team:</span>
            <span className="font-semibold text-foreground truncate">{packet.team_name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Factory size={11} className="text-muted-foreground" />
            <span className="text-muted-foreground">Factory:</span>
            <span className="font-semibold text-foreground truncate">{packet.factory || '—'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays size={11} className="text-muted-foreground" />
            <span className="text-muted-foreground">Received:</span>
            <span className="font-semibold text-foreground">{formatDate(packet.date_received)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Package2 size={11} className="text-muted-foreground" />
            <span className="text-muted-foreground">Total Cards:</span>
            <span className="font-semibold text-foreground">{packet.sd_card_count}</span>
          </div>
          {packet.assigned_to && (
            <div className="flex items-center gap-1.5 col-span-2">
              <UserCheck size={11} className="text-blue-600" />
              <span className="text-muted-foreground">Assigned to:</span>
              <span className="font-semibold text-blue-700">{packet.assigned_to}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Card counts */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
              Card Counts
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Actual Count */}
              <div className="border border-foreground/30 bg-muted/30 rounded-lg p-3 flex flex-col gap-1">
                <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Actual Count *
                </label>
                <input
                  type="number" min={0}
                  value={actualCount}
                  onChange={e => setActualCount(e.target.value)}
                  className="w-full bg-transparent text-lg font-bold tabular-nums focus:outline-none"
                />
              </div>
              {/* Missing Cards */}
              <div className={`border rounded-lg p-3 flex flex-col gap-1 transition-colors ${
                missing > 0 ? 'border-red-400 bg-red-50' : 'border-border bg-background'
              }`}>
                <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Missing Cards
                </label>
                <input
                  type="number" min={0}
                  value={missingCount}
                  onChange={e => setMissingCount(e.target.value)}
                  className="w-full bg-transparent text-lg font-bold tabular-nums focus:outline-none"
                />
              </div>
              {/* Red Cards */}
              <div className={`border rounded-lg p-3 flex flex-col gap-1 transition-colors ${
                red > 0 ? 'border-red-500 bg-red-50' : 'border-border bg-background'
              }`}>
                <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Red Cards
                </label>
                <input
                  type="number" min={0}
                  value={redCardsCount}
                  onChange={e => setRedCardsCount(e.target.value)}
                  className="w-full bg-transparent text-lg font-bold tabular-nums focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Ingested By + Deployment Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1.5">
                <UserCheck size={11} /> Ingested By *
              </label>
              <Input
                value={ingestedBy}
                onChange={e => setIngestedBy(e.target.value)}
                placeholder="Person's name"
                className="h-10"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1.5">
                <CalendarDays size={11} /> Deployment Date *
              </label>
              <input
                type="date"
                value={deploymentDate}
                onChange={e => setDeploymentDate(e.target.value)}
                className="w-full h-10 border border-input bg-background px-3 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1.5">
              <FileText size={11} /> Notes{' '}
              <span className="font-normal normal-case text-muted-foreground">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes about this ingestion…"
              rows={2}
              className="w-full text-sm border border-input bg-background rounded-md px-3 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {error && (
            <p className="text-[11px] text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white h-11"
            >
              <CheckCircle size={13} />
              {loading ? 'Saving…' : 'Mark Ingestion Complete'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="h-11 px-4">
              Cancel
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  )
}
