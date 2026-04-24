'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Clock, Boxes, FileText, Inbox, LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { AppSidebar } from '@/components/AppSidebar'

const navItems = [
  {
    href: '/logistics/log-arrival',
    label: 'Log New Arrival',
    icon: <Package size={14} />,
  },
  {
    href: '/logistics/pending',
    label: 'Pending Count & Repack',
    icon: <Clock size={14} />,
  },
  {
    href: '/logistics/ready-to-ingest',
    label: 'Ready to Ingest',
    icon: <Inbox size={14} />,
  },
  {
    href: '/logistics/inventory',
    label: 'Equipment Inventory',
    icon: <Boxes size={14} />,
  },
  {
    href: '/logistics/report',
    label: 'Reports',
    icon: <FileText size={14} />,
  },
]

export default function LogisticsLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (user && user.role !== 'logistics' && user.role !== 'admin') {
      router.replace('/')
    }
  }, [user, router])

  if (!user) return null

  // ── Sidebar header: app title + user info ──────────────────────────────────
  const sidebarHeader = (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold tracking-tight">Build AI Tracker</span>
      <span className="text-[10px] font-semibold text-blue-700">Logistics</span>
      <span className="text-[10px] text-muted-foreground mt-1 truncate">{user.name}</span>
    </div>
  )

  // ── Sidebar footer: logout ────────────────────────────────────────────────
  const sidebarFooter = (
    <Button
      variant="ghost"
      size="sm"
      className="w-full gap-2 justify-start text-muted-foreground hover:text-foreground"
      onClick={logout}
    >
      <LogOut size={12} /> Logout
    </Button>
  )

  return (
    <div className="min-h-screen bg-background">

      {/* ── Desktop sidebar (fixed, 224 px wide) ─────────────────────────────── */}
      <AppSidebar
        items={navItems}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        header={sidebarHeader}
        footer={sidebarFooter}
      />

      {/* ── Mobile: floating burger button ───────────────────────────────────── */}
      <button
        className={`md:hidden fixed top-3 left-3 z-40 p-2 rounded-lg bg-card border border-border shadow-sm text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95 ${sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={16} />
      </button>

      {/* ── Page content — offset right on desktop to clear the sidebar ──────── */}
      <div className="md:pl-56 min-h-screen flex flex-col">
        <main className="flex-1 px-4 md:px-8 py-8 pt-14 md:pt-8">
          {children}
        </main>
        <footer className="border-t border-border py-3 text-center text-[10px] text-muted-foreground uppercase tracking-wider">
          Build AI Tracker · Logistics
        </footer>
      </div>

    </div>
  )
}
