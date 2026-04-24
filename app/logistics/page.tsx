'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Boxes, LogOut } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import LogisticsDashboard from '@/components/LogisticsDashboard'

export default function LogisticsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && user.role !== 'logistics' && user.role !== 'admin') {
      router.replace('/')
    }
  }, [user, router])

  if (!user) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Topbar */}
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-11 flex items-center gap-3">
          <span className="text-xs font-semibold tracking-tight">Build AI Tracker</span>
          <span className="text-border">|</span>
          <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 text-[10px]">
            Logistics
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground hidden sm:inline">{user.name}</span>
            <Link href="/inventory">
              <Button variant="outline" size="xs" className="gap-1">
                <Boxes size={11} /> Inventory
              </Button>
            </Link>
            <Button variant="ghost" size="xs" className="gap-1 text-muted-foreground" onClick={logout}>
              <LogOut size={11} /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 flex-1 flex flex-col gap-4">

        <div className="flex items-center gap-2">
          <Package size={16} className="text-blue-600" />
          <span className="text-sm font-semibold">SD Card Packet Tracking</span>
        </div>

        <LogisticsDashboard />

      </main>

      <footer className="border-t border-border py-3 text-center text-[10px] text-muted-foreground uppercase tracking-wider">
        Build AI Tracker · Logistics
      </footer>
    </div>
  )
}
