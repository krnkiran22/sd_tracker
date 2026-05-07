'use client'

import { useEffect, useState, useCallback } from 'react'
import { MessageCircle, RefreshCw, Wifi, WifiOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type WaStatus = {
  ready: boolean
  qr_pending: boolean
  message: string
  qr: string | null
  error?: string
}

type Phase = 'loading' | 'connected' | 'qr' | 'initialising' | 'error'

function getPhase(data: WaStatus | null, fetchError: boolean): Phase {
  if (fetchError)               return 'error'
  if (!data)                    return 'loading'
  if (data.ready)               return 'connected'
  if (data.qr)                  return 'qr'
  if (data.error)               return 'error'
  return 'initialising'
}

export default function WhatsAppPage() {
  const [status, setStatus]       = useState<WaStatus | null>(null)
  const [fetchError, setFetchError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const poll = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const res  = await fetch('/api/wa-status', { cache: 'no-store' })
      const data = await res.json() as WaStatus
      setStatus(data)
      setFetchError(!res.ok)
      setLastUpdated(new Date())
    } catch {
      setFetchError(true)
    } finally {
      if (manual) setRefreshing(false)
    }
  }, [])

  // Initial load + auto-poll every 8 seconds
  useEffect(() => {
    poll()
    const id = setInterval(() => poll(), 8000)
    return () => clearInterval(id)
  }, [poll])

  const phase = getPhase(status, fetchError)

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-green-50 border border-green-200">
          <MessageCircle size={22} className="text-green-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">WhatsApp Connection</h1>
          <p className="text-xs text-muted-foreground">Manage the WhatsApp notification link</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto gap-1.5 text-xs"
          onClick={() => poll(true)}
          disabled={refreshing}
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {/* Status card */}
      <div className={`rounded-2xl border p-5 mb-6 transition-colors ${
        phase === 'connected'   ? 'border-green-200  bg-green-50'  :
        phase === 'qr'          ? 'border-amber-200  bg-amber-50'  :
        phase === 'error'       ? 'border-red-200    bg-red-50'    :
                                  'border-border      bg-card'
      }`}>
        <div className="flex items-center gap-3">
          {phase === 'connected'   && <CheckCircle2 size={20} className="text-green-600 shrink-0" />}
          {phase === 'qr'          && <Wifi          size={20} className="text-amber-600 shrink-0" />}
          {phase === 'initialising'&& <Loader2       size={20} className="text-blue-500 shrink-0 animate-spin" />}
          {phase === 'loading'     && <Loader2       size={20} className="text-muted-foreground shrink-0 animate-spin" />}
          {phase === 'error'       && <AlertCircle   size={20} className="text-red-600 shrink-0" />}
          {phase === 'qr'          && <WifiOff       size={20} className="text-amber-500 shrink-0 hidden" />}

          <div>
            <p className={`text-sm font-semibold ${
              phase === 'connected'    ? 'text-green-800' :
              phase === 'qr'           ? 'text-amber-800' :
              phase === 'error'        ? 'text-red-800'   :
                                         'text-foreground'
            }`}>
              {phase === 'connected'    && '✅ Connected'}
              {phase === 'qr'           && 'Scan QR to connect'}
              {phase === 'initialising' && 'Starting up…'}
              {phase === 'loading'      && 'Checking status…'}
              {phase === 'error'        && 'Connection error'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {phase === 'connected'    && 'WhatsApp notifications are active and sending.'}
              {phase === 'qr'           && 'Open WhatsApp → Linked Devices → Link a Device → scan below.'}
              {phase === 'initialising' && (status?.message || 'Chromium is launching, please wait 20–30s…')}
              {phase === 'loading'      && 'Fetching status from backend…'}
              {phase === 'error'        && (status?.message || 'Could not reach the backend. Check Railway logs.')}
            </p>
          </div>
        </div>
      </div>

      {/* QR code */}
      {phase === 'qr' && status?.qr && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-200 bg-white p-6">
          <img
            src={status.qr}
            alt="WhatsApp QR code"
            className="w-64 h-64 rounded-xl border-4 border-green-400 shadow-md"
          />
          <p className="text-xs text-center text-muted-foreground max-w-xs">
            QR code expires in ~60 seconds. This page auto-refreshes every 8 seconds.
            Once scanned, the status above will turn green.
          </p>
        </div>
      )}

      {/* Connected visual */}
      {phase === 'connected' && (
        <div className="flex flex-col items-center gap-3 py-8 rounded-2xl border border-green-200 bg-green-50">
          <div className="p-4 rounded-full bg-green-100">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <p className="text-sm font-medium text-green-800">WhatsApp is linked</p>
          <p className="text-xs text-green-700 text-center max-w-xs">
            Notifications will be sent automatically when packets are received,
            counted, and ingestion is completed.
          </p>
        </div>
      )}

      {/* Initialising hint */}
      {phase === 'initialising' && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Loader2 size={32} className="text-blue-400 animate-spin" />
          <p className="text-sm text-muted-foreground">Chromium is starting up…</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            This takes 20–30 seconds after a Railway cold start. The page will
            update automatically once the QR is ready.
          </p>
        </div>
      )}

      {/* Footer timestamp */}
      {lastUpdated && (
        <p className="text-center text-[10px] text-muted-foreground mt-6">
          Last checked: {lastUpdated.toLocaleTimeString()} · auto-refreshes every 8s
        </p>
      )}
    </div>
  )
}
