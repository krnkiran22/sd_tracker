'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Boxes, FileText, LogOut, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import IngestionDashboard from '@/components/IngestionDashboard'
import AdminPanel from '@/components/AdminPanel'
import PacketForm from '@/components/PacketForm'
import PacketsBoard from '@/components/PacketsBoard'
import LogisticsDashboard from '@/components/LogisticsDashboard'

export default function HomePage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  // Auto-redirect single-role users to their primary page
  useEffect(() => {
    if (!user) return
    if (user.role === 'logistics') router.replace('/logistics')
    if (user.role === 'ingestion') {
      // ingestion stays here — their dashboard is on this page
    }
  }, [user, router])

  if (!user) return null

  const isAdmin     = user.role === 'admin'
  const isIngestion = user.role === 'ingestion'

  const roleBadge: Record<string, string> = {
    admin:     'bg-purple-100 text-purple-700 border-purple-200',
    logistics: 'bg-blue-100 text-blue-700 border-blue-200',
    ingestion: 'bg-green-100 text-green-700 border-green-200',
    user:      'bg-gray-100 text-gray-600 border-gray-200',
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Topbar */}
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-11 flex items-center gap-3">
          <span className="text-xs font-semibold tracking-tight">Build AI Tracker</span>
          <span className="text-border">|</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${roleBadge[user.role] ?? ''}`}>
            {user.role}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground hidden sm:inline">{user.name}</span>
            {isAdmin && (
              <>
                <Link href="/logistics">
                  <Button variant="outline" size="xs" className="gap-1">
                    <Package size={11} /> SD Cards
                  </Button>
                </Link>
                <Link href="/inventory">
                  <Button variant="outline" size="xs" className="gap-1">
                    <Boxes size={11} /> Inventory
                  </Button>
                </Link>
                <Link href="/report">
                  <Button variant="outline" size="xs" className="gap-1">
                    <FileText size={11} /> Reports
                  </Button>
                </Link>
              </>
            )}
            <Button variant="ghost" size="xs" className="gap-1 text-muted-foreground" onClick={logout}>
              <LogOut size={11} /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 flex flex-col gap-6">

        {/* ── Ingestion role ───────────────────────────────────────────────── */}
        {isIngestion && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Ingestion Dashboard</span>
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-[10px]">
                Ingestion Team
              </Badge>
            </div>
            <IngestionDashboard />
          </>
        )}

        {/* ── Admin role ───────────────────────────────────────────────────── */}
        {isAdmin && (
          <>
            {/* Quick-nav cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link href="/logistics" className="block">
                <Card className="hover:border-blue-300 hover:bg-blue-50/40 transition-colors cursor-pointer gap-0 py-0">
                  <CardContent className="py-5 flex items-center gap-3">
                    <Package size={22} className="text-blue-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">SD Card Logistics</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Log arrivals · Count & repack · Pending queue</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/inventory" className="block">
                <Card className="hover:border-violet-300 hover:bg-violet-50/40 transition-colors cursor-pointer gap-0 py-0">
                  <CardContent className="py-5 flex items-center gap-3">
                    <Boxes size={22} className="text-violet-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Equipment Inventory</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Sent / received · Team overview · Charts</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/report" className="block">
                <Card className="hover:border-gray-300 hover:bg-gray-50/40 transition-colors cursor-pointer gap-0 py-0">
                  <CardContent className="py-5 flex items-center gap-3">
                    <FileText size={22} className="text-gray-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Reports</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Transaction history · Export</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Ingestion queue */}
            <details className="group">
              <summary className="cursor-pointer flex items-center gap-2 mb-3 list-none">
                <span className="text-xs font-semibold">Ingestion Queue</span>
                <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-[10px]">Ingestion</Badge>
                <span className="text-[10px] text-muted-foreground ml-auto group-open:hidden">▸ expand</span>
                <span className="text-[10px] text-muted-foreground ml-auto hidden group-open:inline">▾ collapse</span>
              </summary>
              <IngestionDashboard />
            </details>

            {/* Admin CRUD panel */}
            <details className="group">
              <summary className="cursor-pointer flex items-center gap-2 mb-3 list-none">
                <ShieldAlert size={12} className="text-red-500" />
                <span className="text-xs font-semibold">Admin Panel</span>
                <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50 text-[10px]">CRUD</Badge>
                <span className="text-[10px] text-muted-foreground ml-auto group-open:hidden">▸ expand</span>
                <span className="text-[10px] text-muted-foreground ml-auto hidden group-open:inline">▾ collapse</span>
              </summary>
              <AdminPanel />
            </details>

            {/* Full logistics + packets for admin (hidden in collapsible) */}
            <details className="group">
              <summary className="cursor-pointer flex items-center gap-2 mb-3 list-none">
                <span className="text-xs font-semibold">SD Card Packet Logging</span>
                <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 text-[10px]">Logistics</Badge>
                <span className="text-[10px] text-muted-foreground ml-auto group-open:hidden">▸ expand</span>
                <span className="text-[10px] text-muted-foreground ml-auto hidden group-open:inline">▾ collapse</span>
              </summary>
              <div className="flex flex-col gap-4 mt-1">
                <LogisticsDashboard />
                <PacketForm onSuccess={() => {}} />
                <PacketsBoard refreshTrigger={0} />
              </div>
            </details>
          </>
        )}

      </main>

      <footer className="border-t border-border py-3 text-center text-[10px] text-muted-foreground uppercase tracking-wider">
        Build AI Tracker · SD Card Ingestion System
      </footer>
    </div>
  )
}
