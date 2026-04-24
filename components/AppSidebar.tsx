'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { useEffect } from 'react'

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
  header?: React.ReactNode
  footer?: React.ReactNode
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
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 active:scale-[0.98] ${
              active
                ? 'bg-blue-600 text-white font-medium shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span className="shrink-0 transition-transform duration-150">{item.icon}</span>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-colors duration-150 ${
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

export function AppSidebar({ items, isOpen, onClose, header, footer }: AppSidebarProps) {
  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* ── Desktop: fixed sidebar ────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 border-r border-border bg-card fixed inset-y-0 left-0 z-30">
        <div className="flex flex-col h-full">
          {header && (
            <div className="px-4 py-4 border-b border-border shrink-0">
              {header}
            </div>
          )}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <NavLinks items={items} onClose={() => {}} />
          </div>
          {footer && (
            <div className="px-4 py-3 border-t border-border shrink-0">
              {footer}
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile: slide-in overlay — always in DOM, driven by translate ──────── */}
      <div
        aria-hidden={!isOpen}
        className={`md:hidden fixed inset-0 z-50 transition-[visibility] duration-300 ${
          isOpen ? 'visible' : 'invisible'
        }`}
      >
        {/* Backdrop — fade in/out */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${
            isOpen ? 'opacity-100 backdrop-blur-sm' : 'opacity-0'
          }`}
          onClick={onClose}
        />

        {/* Sidebar panel — slide in from left */}
        <aside
          className={`absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-card flex flex-col shadow-2xl
            transition-transform duration-300 ease-out will-change-transform ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header + close in one bar */}
          <div className="flex items-start justify-between gap-2 px-4 py-4 border-b border-border shrink-0">
            <div className="flex-1 min-w-0">
              {header}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 mt-0.5 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            <NavLinks items={items} onClose={onClose} />
          </div>

          {footer && (
            <div className="px-4 py-3 border-t border-border shrink-0">
              {footer}
            </div>
          )}
        </aside>
      </div>
    </>
  )
}
