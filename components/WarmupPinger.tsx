'use client'

import { useEffect } from 'react'

// Pings /api/warmup the moment the app loads in the browser.
// /api/warmup immediately pings Railway so it starts waking up from cold start.
// This runs once per browser session and is completely invisible to the user.
export default function WarmupPinger() {
  useEffect(() => {
    fetch('/api/warmup').catch(() => {})
  }, [])
  return null
}
