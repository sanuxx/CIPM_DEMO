import * as React from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, LogOut, Menu, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Avatar, Button, DemoBadge } from './ui'
import { Logo } from './common'
import { cn } from '@/lib/utils'
import { logout } from '@/store/actions'
import { useAuth } from '@/store/hooks'
import { getUnreadCount } from '@/lib/progress'

export interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean; badge?: number }

export function Shell({ nav, area, subtitle }: { nav: NavItem[]; area: 'student' | 'admin'; subtitle: string }) {
  const { db, user } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => setOpen(false), [loc.pathname])
  if (!user) return null
  const unread = area === 'student' ? getUnreadCount(db, user.id) : 0

  const sidebar = (
    <div className="flex h-full flex-col border-r border-line bg-white">
      <div className="flex h-16 shrink-0 items-center justify-between px-5">
        <Logo />
        <button className="rounded-md p-1 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="size-5" /></button>
      </div>
      <p className="px-5 pb-2 pt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{subtitle}</p>
      <nav className="scroll-thin flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label="Main">
        {nav.map((n) => (
          <NavLink
            key={n.label} to={n.to} end={n.end}
            className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', isActive ? 'bg-navy-50 text-navy-800' : 'text-slate-500 hover:bg-slate-50 hover:text-ink')}
          >
            <n.icon className="size-[18px] shrink-0" />
            <span className="flex-1">{n.label}</span>
            {n.label === 'Announcements' && unread > 0 && <span className="rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        <DemoBadge className="mb-1.5" />
        <p className="leading-relaxed">Payments are simulated. Data stays in this browser.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">{sidebar}</div>
        </div>
      )}
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 bg-surface/85 px-4 backdrop-blur sm:px-8">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-5" /></Button>
        <div className="hidden sm:block lg:hidden"><DemoBadge /></div>
        <div className="ml-auto flex items-center gap-2">
          {area === 'student' && (
            <Link to="/app/announcements" className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
              <Bell className="size-5" />
              {unread > 0 && <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white">{unread}</span>}
            </Link>
          )}
          <Link to={area === 'student' ? '/app/profile' : '/admin/settings'} className="flex items-center gap-2.5 rounded-lg px-2 py-1 hover:bg-slate-100">
            <Avatar name={user.name} photo={user.photo} size={32} />
            <span className="hidden text-left leading-tight sm:block">
              <span className="block max-w-40 truncate text-sm font-medium text-ink">{user.name}</span>
              <span className="block text-xs capitalize text-muted">{user.role}</span>
            </span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/login') }}><LogOut className="size-4" /><span className="hidden sm:inline">Sign out</span></Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-2 sm:px-8"><Outlet /></main>
    </div>
  )
}
