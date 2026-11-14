import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uid(prefix = 'id') {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

const lkr = new Intl.NumberFormat('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export function formatLKR(amount: number) {
  return `LKR ${lkr.format(amount)}`
}
export function formatCompactLKR(amount: number) {
  if (amount >= 1_000_000) return `LKR ${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `LKR ${(amount / 1_000).toFixed(0)}K`
  return `LKR ${amount}`
}

export function formatDate(iso: string | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', opts ?? { day: 'numeric', month: 'short', year: 'numeric' })
}
export function formatLongDate(iso: string) {
  return formatDate(iso, { day: 'numeric', month: 'long', year: 'numeric' })
}
export function formatDateTime(iso: string | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} d ago`
  return formatDate(iso)
}
/** 754 → "12:34" */
export function formatDuration(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = h ? String(m).padStart(2, '0') : String(m)
  return `${h ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`
}
export function formatFileSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`
}
export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}
export function addDays(d: Date, days: number) {
  const n = new Date(d)
  n.setDate(n.getDate() + days)
  return n
}
export function addMonths(d: Date, months: number) {
  const n = new Date(d)
  n.setMonth(n.getMonth() + months)
  return n
}
/** "2026-11" */
export function monthKey(iso: string) {
  return iso.slice(0, 7)
}
export function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
}
/** keys for the last n months, oldest first, including the current month */
export function lastMonths(n: number) {
  const now = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
}
export function normalisePhone(v: string) {
  return v.replace(/[\s-]/g, '')
}
export const PHONE_RE = /^(?:\+94|0)7\d{8}$/
export function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}
/** stable hash for deterministic visuals */
export function hashString(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
