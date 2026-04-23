'use client'

import { useState, useEffect, useRef } from 'react'
import { Package, Plus, X, Camera, ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/AuthProvider'
import { apiUrl } from '@/lib/api'

interface PacketFormProps { onSuccess: () => void }

interface TeamInfo { name: string; poc_emails: string; poc_phones: string }

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

  // Team autocomplete
  const [teamInput, setTeamInput]       = useState('')
  const [allTeams, setAllTeams]         = useState<TeamInfo[]>([])
  const [suggestions, setSuggestions]   = useState<TeamInfo[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [factory, setFactory]           = useState('')
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().slice(0, 10))
  const [sdCardCount, setSdCardCount]   = useState('')
  const [notes, setNotes]               = useState('')
  const [pocEmails, setPocEmails]       = useState('')
  const [pocInput, setPocInput]         = useState('')
  const [pocPhones, setPocPhones]       = useState('')
  const [phoneInput, setPhoneInput]     = useState('')

  // Multiple photos
  const [photos, setPhotos]           = useState<string[]>([])
  const cameraRef  = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch(apiUrl('/api/teams'))
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAllTeams(d) })
      .catch(() => {})
  }, [])

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
    if (team.poc_emails) {
      const incoming = team.poc_emails.split(',').map(e => e.trim()).filter(Boolean)
      const current  = pocEmails ? pocEmails.split(',').map(e => e.trim()).filter(Boolean) : []
      setPocEmails(Array.from(new Set([...current, ...incoming])).join(', '))
    }
    if (team.poc_phones) {
      const incoming = team.poc_phones.split(',').map(p => p.trim()).filter(Boolean)
      const current  = pocPhones ? pocPhones.split(',').map(p => p.trim()).filter(Boolean) : []
      setPocPhones(Array.from(new Set([...current, ...incoming])).join(', '))
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const compressed = await Promise.all(
      files.map(f => compressImage(f).catch(() => URL.createObjectURL(f)))
    )
    setPhotos(prev => [...prev, ...compressed])
    e.target.value = ''
  }

  const removePhoto = (idx: number) => setPhotos(prev => prev.filter((_, i) => i !== idx))

  const emailList = pocEmails ? pocEmails.split(',').map(e => e.trim()).filter(Boolean) : []
  const phoneList = pocPhones ? pocPhones.split(',').map(p => p.trim()).filter(Boolean) : []

  const addEmail = () => {
    const e = pocInput.trim()
    if (!e) return
    if (!emailList.includes(e)) setPocEmails([...emailList, e].join(', '))
    setPocInput('')
  }
  const removeEmail = (email: string) => setPocEmails(emailList.filter(e => e !== email).join(', '))

  const addPhone = () => {
    const p = phoneInput.trim()
    if (!p) return
    if (!phoneList.includes(p)) setPocPhones([...phoneList, p].join(', '))
    setPhoneInput('')
  }
  const removePhone = (phone: string) => setPocPhones(phoneList.filter(p => p !== phone).join(', '))

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
          photo_url:     photos[0] ?? null,
          photo_urls:    photos.length ? JSON.stringify(photos) : null,
          entered_by:    user?.name ?? 'Logistics',
          poc_emails:    pocEmails,
          poc_phones:    pocPhones,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }

      // Reset
      setTeamInput(''); setFactory(''); setSdCardCount('')
      setNotes(''); setPocEmails(''); setPocInput(''); setPocPhones(''); setPhoneInput('')
      setPhotos([])
      setSuccess(true); setTimeout(() => setSuccess(false), 4000)
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit. Try again.')
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
                <div className="absolute top-full left-0 right-0 z-50 bg-card border border-border shadow-md max-h-48 overflow-y-auto rounded-b">
                  {suggestions.map(s => (
                    <button key={s.name} type="button"
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                      onMouseDown={() => selectTeam(s)}>
                      <span className="font-medium">{s.name}</span>
                      {s.poc_emails && (
                        <span className="block text-muted-foreground text-[10px] truncate mt-0.5">
                          ✉ {s.poc_emails}
                        </span>
                      )}
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

          {/* Package Photos */}
          <div>
            <label className="text-label block mb-1">
              Package Photos
              <span className="ml-1 text-muted-foreground font-normal">(all sent in email to POCs)</span>
            </label>

            <input ref={cameraRef}  type="file" accept="image/*" capture="environment" multiple
              className="hidden" onChange={handleFileChange} />
            <input ref={galleryRef} type="file" accept="image/*" multiple
              className="hidden" onChange={handleFileChange} />

            {/* Photo thumbnails grid */}
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {photos.map((src, idx) => (
                  <div key={idx} className="relative group">
                    <img src={src} alt={`photo ${idx + 1}`}
                      className="h-20 w-20 object-cover border border-border rounded" />
                    <button type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5"
                onClick={() => cameraRef.current?.click()}>
                <Camera size={12} /> Take Photo
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5"
                onClick={() => galleryRef.current?.click()}>
                <ImageIcon size={12} /> {photos.length > 0 ? 'Add More' : 'Choose from Gallery'}
              </Button>
            </div>
            {photos.length > 0 && (
              <p className="text-[10px] text-blue-700 font-medium mt-1">
                ✓ {photos.length} photo{photos.length > 1 ? 's' : ''} attached — hover thumbnail to remove
              </p>
            )}
          </div>

          {/* POC Emails */}
          <div>
            <label className="text-label block mb-1">
              Team POC Emails
              <span className="ml-1 text-muted-foreground font-normal">(auto-filled when team is selected)</span>
            </label>
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
              Notification email (with photos) will be sent to these addresses on submit.
              Emails are saved per team for next time.
            </p>
          </div>

          {/* WhatsApp Phones */}
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
              WhatsApp notification sent to these numbers at each stage. Numbers saved per team.
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
              ✓ Packet logged. Notification email{photos.length > 0 ? ` with ${photos.length} photo${photos.length > 1 ? 's' : ''}` : ''} sent to POCs.
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
