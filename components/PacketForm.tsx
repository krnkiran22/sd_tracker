'use client'

import { useState, useEffect, useRef } from 'react'
import { Package, Plus, X, Camera, ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/AuthProvider'
import { apiUrl } from '@/lib/api'

interface PacketFormProps { onSuccess: () => void }

// Compress photo to max 1200px, JPEG 0.82 quality — keeps it under ~200KB
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1200
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX }
          else { width = Math.round((width * MAX) / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = ev.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function PacketForm({ onSuccess }: PacketFormProps) {
  const { user } = useAuth()

  const [teamInput, setTeamInput]       = useState('')
  const [allTeams, setAllTeams]         = useState<string[]>([])
  const [suggestions, setSuggestions]   = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [factory, setFactory]           = useState('')
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().slice(0, 10))
  const [sdCardCount, setSdCardCount]   = useState('')
  const [notes, setNotes]               = useState('')
  const [pocEmails, setPocEmails]       = useState('')
  const [pocInput, setPocInput]         = useState('')

  // Photo state
  const [photo, setPhoto]         = useState<string | null>(null)
  const [photoName, setPhotoName] = useState('')
  const cameraRef  = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

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
    e.target.value = ''
  }

  const emailList = pocEmails ? pocEmails.split(',').map(e => e.trim()).filter(Boolean) : []

  const addEmail = () => {
    const e = pocInput.trim()
    if (!e) return
    if (!emailList.includes(e)) setPocEmails([...emailList, e].join(', '))
    setPocInput('')
  }

  const removeEmail = (email: string) => {
    setPocEmails(emailList.filter(e => e !== email).join(', '))
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setError('')
    if (!teamInput.trim())   { setError('Team name is required.'); return }
    if (!factory.trim())     { setError('Factory is required.'); return }
    if (!sdCardCount || Number(sdCardCount) <= 0) { setError('Enter the SD card count.'); return }

    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/packets'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name:     teamInput.trim(),
          factory:       factory.trim(),
          date_received: dateReceived,
          sd_card_count: Number(sdCardCount),
          notes:         notes.trim() || null,
          photo_url:     photo,
          entered_by:    user?.name ?? 'Logistics',
          poc_emails:    pocEmails,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }

      // Reset form
      setTeamInput(''); setFactory(''); setSdCardCount('')
      setNotes(''); setPocEmails(''); setPocInput('')
      setPhoto(null); setPhotoName('')
      setSuccess(true); setTimeout(() => setSuccess(false), 4000)
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="py-4 gap-0 border-blue-200/60 bg-blue-50/30">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Package size={14} className="text-blue-600" />
          Log SD Card Packet Received
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Team + Factory */}
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
              <label className="text-label block mb-1">Factory *</label>
              <Input value={factory} onChange={e => setFactory(e.target.value)} placeholder="Factory / source location…" />
            </div>
          </div>

          {/* Date + Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-label block mb-1">Date Received *</label>
              <Input type="date" value={dateReceived} onChange={e => setDateReceived(e.target.value)} />
            </div>
            <div>
              <label className="text-label block mb-1">SD Card Count *</label>
              <Input
                type="number" min={1} value={sdCardCount}
                onChange={e => setSdCardCount(e.target.value)}
                placeholder="e.g. 250"
              />
            </div>
          </div>

          {/* Package Photo */}
          <div>
            <label className="text-label block mb-1">
              Package Photo
              <span className="ml-1 text-muted-foreground font-normal">(sent in email to POCs)</span>
            </label>

            {/* Hidden file inputs */}
            <input ref={cameraRef}  type="file" accept="image/*" capture="environment"
              className="hidden" onChange={handleFileChange} />
            <input ref={galleryRef} type="file" accept="image/*"
              className="hidden" onChange={handleFileChange} />

            {photo ? (
              <div className="border border-blue-300 bg-blue-50/60 p-3 flex items-start gap-3 rounded">
                <img src={photo} alt="package preview"
                  className="h-20 w-20 object-cover border border-border rounded flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-blue-800">✓ Photo attached</p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{photoName}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    This photo will be embedded in the notification email to the team POCs.
                  </p>
                  <button type="button"
                    onClick={() => { setPhoto(null); setPhotoName('') }}
                    className="mt-1.5 text-[10px] text-red-600 hover:underline flex items-center gap-1">
                    <X size={10} /> Remove photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5"
                  onClick={() => cameraRef.current?.click()}>
                  <Camera size={12} /> Take Photo
                </Button>
                <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5"
                  onClick={() => galleryRef.current?.click()}>
                  <ImageIcon size={12} /> Choose from Gallery
                </Button>
              </div>
            )}
          </div>

          {/* POC Emails */}
          <div>
            <label className="text-label block mb-1">Team POC Emails</label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={pocInput}
                onChange={e => setPocInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmail() } }}
                placeholder="poc@company.com — press Enter to add"
              />
              <Button type="button" variant="outline" size="sm" onClick={addEmail} className="shrink-0">
                <Plus size={12} />
              </Button>
            </div>
            {emailList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {emailList.map(email => (
                  <span key={email}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-medium">
                    {email}
                    <button type="button" onClick={() => removeEmail(email)}
                      className="hover:text-red-600 transition-colors ml-0.5">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              Notification email (with photo) will be sent to these addresses on submit.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="text-label block mb-1">Notes</label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes about this packet…" />
          </div>

          {error   && <p className="text-[10px] text-destructive">{error}</p>}
          {success && (
            <p className="text-[10px] text-green-600 font-medium">
              ✓ Packet logged. Notification email{photo ? ' with photo' : ''} sent to POCs.
            </p>
          )}

          <Button type="submit" disabled={loading}
            className="w-full sm:w-auto sm:self-start gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Package size={12} />
            {loading ? 'Logging…' : 'Log Received Packet'}
          </Button>

        </form>
      </CardContent>
    </Card>
  )
}
