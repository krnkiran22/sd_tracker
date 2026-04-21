'use client'

import { useState, useEffect, useRef } from 'react'
import { Camera, X, Upload, ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ITEMS } from '@/lib/items'
import { useAuth } from '@/components/AuthProvider'
import { apiUrl } from '@/lib/api'

const LOGISTICS_PEOPLE = ['Amaan', 'Nathish']

type ItemKey = 'devices' | 'sd_cards' | 'hubs' | 'cables' | 'extension_boxes' | 'sd_card_readers' | 'other'

const emptyItems = (): Record<ItemKey, number> => ({
  devices: 0, sd_cards: 0, hubs: 0, cables: 0,
  extension_boxes: 0, sd_card_readers: 0, other: 0,
})

// Compress image to max 900px and JPEG 0.75 quality — keeps photos under ~150KB
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const MAX = 900
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX }
          else { width = Math.round((width * MAX) / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.onerror = reject
      img.src = ev.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface TransactionFormProps { onSuccess: () => void }

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const { user } = useAuth()
  const isLogistics = user?.role === 'logistics'

  const [teamInput, setTeamInput]       = useState('')
  const [suggestions, setSuggestions]   = useState<string[]>([])
  const [allTeams, setAllTeams]         = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [type, setType]                 = useState<'sent' | 'received'>('sent')
  const [date, setDate]                 = useState(new Date().toISOString().slice(0, 10))
  const [items, setItems]               = useState(emptyItems())
  const [otherDesc, setOtherDesc]       = useState('')
  const [notes, setNotes]               = useState('')
  const [enteredBy, setEnteredBy]       = useState('')
  const [photo, setPhoto]               = useState<string | null>(null)
  const [photoName, setPhotoName]       = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState(false)

  const cameraRef   = useRef<HTMLInputElement>(null) // direct camera
  const galleryRef  = useRef<HTMLInputElement>(null) // gallery picker
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(apiUrl('/api/teams')).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setAllTeams(d)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!teamInput.trim()) { setSuggestions([]); return }
    const q = teamInput.toLowerCase()
    setSuggestions(allTeams.filter(t => t.toLowerCase().includes(q)))
  }, [teamInput, allTeams])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await compressImage(file)
      setPhoto(compressed)
      setPhotoName(file.name)
    } catch {
      setPhoto(URL.createObjectURL(file))
      setPhotoName(file.name)
    }
    // Reset input so same file can be re-selected if needed
    e.target.value = ''
  }

  const setItem = (key: ItemKey, val: number) =>
    setItems(prev => ({ ...prev, [key]: Math.max(0, val) }))

  const totalItems = Object.values(items).reduce((a, b) => a + b, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!teamInput.trim()) { setError('Team name is required.'); return }
    if (totalItems === 0)   { setError('Enter at least one item quantity.'); return }
    if (isLogistics && !enteredBy) { setError('Please select who is entering this record.'); return }
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/transactions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name: teamInput.trim(), type, date, ...items,
          other_description: otherDesc, notes, photo_url: photo,
          entered_by: isLogistics ? enteredBy : (user?.name ?? null),
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }

      if (!allTeams.includes(teamInput.trim())) {
        setAllTeams(prev => [...prev, teamInput.trim()].sort())
      }
      setItems(emptyItems()); setOtherDesc(''); setNotes(''); setPhoto(null); setPhotoName(''); setEnteredBy('')
      setSuccess(true); setTimeout(() => setSuccess(false), 3000)
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to record. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="py-4 gap-0">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="flex items-center gap-3">
          Record Transaction
          <div className="flex border border-border ml-auto">
            {(['sent', 'received'] as const).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  type === t ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'
                }`}>
                {t === 'sent' ? '↑ Sent' : '↓ Received'}
              </button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Team + Date */}
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
                <div className="absolute top-full left-0 right-0 z-50 bg-card border border-border shadow-md max-h-40 overflow-y-auto">
                  {suggestions.map(s => (
                    <button key={s} type="button"
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                      onMouseDown={() => { setTeamInput(s); setShowDropdown(false) }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-label block mb-1">Date *</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          {/* Items grid */}
          <div>
            <label className="text-label block mb-2">Items</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
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

          {/* Notes + Photo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-label block mb-1">Notes</label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" />
            </div>

            <div>
              <label className="text-label block mb-1">Photo</label>

              {/* Hidden inputs */}
              <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
              <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

              {photo ? (
                /* Photo attached — big clear indicator */
                <div className="border border-foreground bg-muted/40 p-2 flex items-center gap-3">
                  <img src={photo} alt="preview"
                    className="h-14 w-14 object-cover border border-border flex-shrink-0 rounded-sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-foreground">✓ Photo attached</div>
                    <div className="text-[10px] text-muted-foreground truncate">{photoName || 'image'}</div>
                  </div>
                  <button type="button" onClick={() => { setPhoto(null); setPhotoName('') }}
                    className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                /* Two buttons: camera + gallery */
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5"
                    onClick={() => cameraRef.current?.click()}>
                    <Camera size={12} /> Camera
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5"
                    onClick={() => galleryRef.current?.click()}>
                    <ImageIcon size={12} /> Gallery
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Entered By — required for logistics, shown for all */}
          <div className="max-w-xs">
            <label className="text-label block mb-1">
              Entered By {isLogistics && <span className="text-destructive">*</span>}
            </label>
            {isLogistics ? (
              <select value={enteredBy} onChange={e => setEnteredBy(e.target.value)}
                className="w-full h-9 border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">— Select person —</option>
                {LOGISTICS_PEOPLE.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : (
              <Input value={user?.name ?? ''} disabled className="opacity-60" />
            )}
          </div>

          {error   && <p className="text-[10px] text-destructive">{error}</p>}
          {success && <p className="text-[10px] text-green-600 font-medium">✓ Transaction recorded successfully</p>}

          <Button type="submit" disabled={loading || totalItems === 0} className="w-full sm:w-auto sm:self-start gap-2">
            <Upload size={12} />
            {loading ? 'Recording…' : `Record ${type === 'sent' ? 'Send' : 'Receive'}`}
          </Button>

        </form>
      </CardContent>
    </Card>
  )
}
