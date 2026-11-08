'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Scale, Repeat, LogOut } from 'lucide-react'
import { logout } from '@/lib/auth-actions'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/acerto', label: 'Acerto', icon: Scale },
  { href: '/assinaturas', label: 'Assinaturas', icon: Repeat },
]

export function NavTabs() {
  const pathname = usePathname()
  if (pathname.startsWith('/login')) return null
  return (
    <nav className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10 backdrop-blur">
      <div className="max-w-3xl mx-auto px-4 flex gap-1">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                active
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
        <form action={logout} className="ml-auto flex items-center">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-2 py-3 text-xs text-slate-500 hover:text-slate-200 transition-colors"
            title="Sair"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </form>
      </div>
    </nav>
  )
}
