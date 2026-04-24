'use client'

import { useState } from 'react'
import { LayoutDashboard, Package, Boxes, FileText, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { AppSidebar } from '@/components/AppSidebar'
import type { NavItem } from '@/components/AppSidebar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) return null

  const isAdmin     = user.role === 'admin'
  const isLogistics = user.role === 'logistics'
  const isIngestion = user.role === 'ingestion'

  const roleBadge: Record<string, string> = {
    admin:     'text-purple-700',
    logistics: 'text-blue-700',
    ingestion: 'text-green-700',
    user:      'text-gray-600',
  }

  const navItems: NavItem[] = [
    ...(isAdmin || isIngestion
      ? [{ href: '/', label: 'Dashboard', icon: <LayoutDashboard size={14} /> }]
      : []),
    ...(isAdmin
      ? [{ href: '/logistics', label: 'SD Card Logistics', icon: <Package size={14} /> }]
      : []),
    ...(isAdmin || isLogistics
      ? [{ href: '/inventory', label: 'Equipment Inventory', icon: <Boxes size={14} /> }]
      : []),
    ...(isAdmin || isLogistics
      ? [{ href: '/report', label: 'Reports', icon: <FileText size={14} /> }]
      : []),
  ]

  const sidebarHeader = (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold tracking-tight">Build AI Tracker</span>
      <span className={`text-[10px] font-semibold capitalize ${roleBadge[user.role] ?? ''}`}>
        {user.role}
      </span>
      <span className="text-[10px] text-muted-foreground mt-1 truncate">{user.name}</span>
    </div>
  )

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

      {/* Desktop sidebar */}
      <AppSidebar
        items={navItems}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        header={sidebarHeader}
        footer={sidebarFooter}
      />

      {/* Mobile burger button */}
      <button
        className={`md:hidden fixed top-3 left-3 z-40 p-2 rounded-lg bg-card border border-border shadow-sm text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95 ${sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={16} />
      </button>

      {/* Page content offset on desktop */}
      <div className="md:pl-56 min-h-screen flex flex-col">
        <main className="flex-1 px-4 md:px-8 py-8 pt-14 md:pt-8">
          {children}
        </main>
        <footer className="border-t border-border py-3 text-center text-[10px] text-muted-foreground uppercase tracking-wider">
          Build AI Tracker · SD Card Ingestion System
        </footer>
      </div>

    </div>
  )
}
