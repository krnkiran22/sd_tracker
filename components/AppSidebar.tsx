'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
}

interface AppSidebarProps {
  items: NavItem[]
  isOpen: boolean
  onClose: () => void
  header?: React.ReactNode   // e.g. app title + user info
  footer?: React.ReactNode   // e.g. logout button
}

function NavLinks({ items, onClose }: { items: NavItem[]; onClose: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {items.map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              active
                ? 'bg-blue-600 text-white font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarShell({
  items,
  onClose,
  header,
  footer,
}: {
  items: NavItem[]
  onClose: () => void
  header?: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-full">
      {header && (
        <div className="px-4 py-4 border-b border-border shrink-0">
          {header}
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <NavLinks items={items} onClose={onClose} />
      </div>
      {footer && (
        <div className="px-4 py-3 border-t border-border shrink-0">
          {footer}
        </div>
      )}
    </div>
  )
}

export function AppSidebar({ items, isOpen, onClose, header, footer }: AppSidebarProps) {
  return (
    <>
      {/* ── Desktop: fixed sidebar ──────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 border-r border-border bg-card fixed inset-y-0 left-0 z-30">
        <SidebarShell items={items} onClose={() => {}} header={header} footer={footer} />
      </aside>

      {/* ── Mobile: slide-in overlay ────────────────────────────────────────── */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="relative w-64 bg-card flex flex-col shadow-xl">
            {/* Close button row */}
            <div className="flex items-center justify-end px-4 py-3 border-b border-border shrink-0">
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col">
              {header && (
                <div className="px-4 py-3 border-b border-border">
                  {header}
                </div>
              )}
              <NavLinks items={items} onClose={onClose} />
            </div>
            {footer && (
              <div className="px-4 py-3 border-t border-border shrink-0">
                {footer}
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  )
}
