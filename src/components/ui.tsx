import * as React from 'react'
import { Dialog as D } from 'radix-ui'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Inbox, Loader2, Search, X } from 'lucide-react'
import { cn, initials } from '@/lib/utils'

/* ───────── Button ───────── */
type BtnVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent'
type BtnSize = 'sm' | 'md' | 'lg' | 'icon'
const btnVariants: Record<BtnVariant, string> = {
  primary: 'bg-navy-800 text-white hover:bg-navy-900',
  secondary: 'bg-navy-50 text-navy-800 hover:bg-navy-100',
  outline: 'border border-line bg-white text-slate-700 hover:bg-slate-50 hover:text-ink',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  accent: 'bg-accent-500 text-white hover:bg-accent-600',
}
const btnSizes: Record<BtnSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-11 px-6 text-sm gap-2', icon: 'h-9 w-9',
}
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: BtnSize
  loading?: boolean
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, disabled, children, type = 'button', ...p }, ref,
) {
  return (
    <button
      ref={ref} type={type} disabled={disabled || loading}
      className={cn('inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap', btnVariants[variant], btnSizes[size], className)}
      {...p}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
})

/* ───────── Form controls ───────── */
const field = 'w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-slate-400 transition-colors focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-200 disabled:bg-slate-50 disabled:text-slate-500 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-red-100'
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(field, 'h-10', className)} {...p} />
})
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(field, 'min-h-24 py-2', className)} {...p} />
})
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...p }, ref) {
  return <select ref={ref} className={cn(field, 'h-10 pr-8', className)} {...p} />
})

export function Field({ label, error, hint, children, className, htmlFor }: {
  label?: string; error?: string; hint?: string; children: React.ReactNode; className?: string; htmlFor?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">{label}</label>}
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p role="alert" className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

export function Switch({ checked, onChange, label, description, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; label?: string; description?: string; disabled?: boolean
}) {
  return (
    <label className={cn('flex items-start justify-between gap-4', disabled ? 'opacity-50' : 'cursor-pointer')}>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-medium text-slate-800">{label}</span>}
          {description && <span className="block text-xs text-muted">{description}</span>}
        </span>
      )}
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" role="switch" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-5 w-9 rounded-full bg-slate-300 transition-colors peer-checked:bg-navy-700 peer-focus-visible:ring-2 peer-focus-visible:ring-navy-400 peer-focus-visible:ring-offset-2" />
        <span className="absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  )
}

/* ───────── Surfaces ───────── */
export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-xl border border-line bg-white shadow-soft', className)} {...p} />
}
export function CardHeader({ title, description, action, className }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-5 pb-1 pt-5', className)}>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

type Tone = 'slate' | 'navy' | 'green' | 'amber' | 'red' | 'blue' | 'purple'
const tones: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-600',
  navy: 'bg-navy-100 text-navy-800',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  blue: 'bg-sky-50 text-sky-700',
  purple: 'bg-violet-50 text-violet-700',
}
export function Badge({ tone = 'slate', className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}>{children}</span>
}

export function ProgressBar({ value, className, tone = 'navy' }: { value: number; className?: string; tone?: 'navy' | 'green' | 'amber' }) {
  const color = { navy: 'bg-navy-700', green: 'bg-emerald-500', amber: 'bg-accent-500' }[tone]
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

export function Avatar({ name, photo, size = 36, className }: { name: string; photo?: string; size?: number; className?: string }) {
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)
  return photo ? (
    <img src={photo} alt={name} width={size} height={size} className={cn('shrink-0 rounded-full object-cover', className)} style={{ width: size, height: size }} />
  ) : (
    <span
      aria-label={name}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', className)}
      style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${hue} 42% 40%)` }}
    >
      {initials(name)}
    </span>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-5 animate-spin text-navy-700', className)} aria-label="Loading" />
}
export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-muted">
      <Spinner className="size-7" />
      {label}
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: { icon?: React.ComponentType<{ className?: string }>; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-navy-50 text-navy-600"><Icon className="size-6" /></div>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', description, action }: { title?: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-red-100 bg-red-50 px-6 py-8 text-center">
      <h3 className="font-semibold text-red-800">{title}</h3>
      {description && <p className="mt-1 text-sm text-red-700">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, hint, tone = 'navy' }: {
  label: string; value: React.ReactNode; icon: React.ComponentType<{ className?: string }>; hint?: string; tone?: 'navy' | 'green' | 'amber' | 'blue' | 'purple'
}) {
  const bg = { navy: 'bg-navy-50 text-navy-700', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', blue: 'bg-sky-50 text-sky-600', purple: 'bg-violet-50 text-violet-600' }[tone]
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', bg)}><Icon className="size-4" /></span>
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-3 truncate text-[26px] font-semibold leading-none tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </Card>
  )
}

/* ───────── Dialogs ───────── */
export function Modal({ open, onOpenChange, title, description, children, footer, size = 'md' }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children?: React.ReactNode; footer?: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const w = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size]
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <D.Content
          aria-describedby={description ? undefined : undefined}
          className={cn('fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white shadow-pop data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95', w)}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <div className="min-w-0">
              <D.Title className="text-lg font-semibold text-ink">{title}</D.Title>
              {description ? <D.Description className="mt-0.5 text-sm text-muted">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
            </div>
            <D.Close asChild><Button variant="ghost" size="icon" aria-label="Close"><X className="size-4" /></Button></D.Close>
          </div>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-slate-50/60 px-6 py-3.5 rounded-b-2xl">{footer}</div>}
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}

export interface ConfirmOptions {
  title: string
  description: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
}
export function ConfirmDialog({ options, onClose }: { options: ConfirmOptions | null; onClose: () => void }) {
  return (
    <Modal
      open={!!options} onOpenChange={(o) => !o && onClose()} title={options?.title ?? ''} description={options?.description} size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={options?.danger ? 'danger' : 'primary'} onClick={() => { options?.onConfirm(); onClose() }}>
            {options?.confirmLabel ?? 'Confirm'}
          </Button>
        </>
      }
    />
  )
}
/** Convenience hook: const [confirm, dialog] = useConfirm(); confirm({...}); render {dialog} */
export function useConfirm() {
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null)
  const dialog = <ConfirmDialog options={options} onClose={() => setOptions(null)} />
  return [setOptions, dialog] as const
}

/* ───────── Tabs ───────── */
export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div role="tablist" className={cn('scroll-thin flex gap-1 overflow-x-auto border-b border-line', className)}>
      {tabs.map((t) => (
        <button
          key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={cn('-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors', value === t.id ? 'border-navy-700 text-navy-800' : 'border-transparent text-muted hover:text-ink')}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

/* ───────── Data table: search, filters, sorting, pagination ───────── */
export interface Column<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  /** value used for sorting; omit to make the column unsortable */
  sort?: (row: T) => string | number
  className?: string
}

export function DataTable<T>({
  rows, columns, rowKey, pageSize = 10, search, searchPlaceholder = 'Search…', filters, onRowClick, empty, toolbarExtra, initialSort,
}: {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  pageSize?: number
  /** text used for the search box */
  search?: (row: T) => string
  searchPlaceholder?: string
  filters?: React.ReactNode
  onRowClick?: (row: T) => void
  empty?: { title: string; description?: string }
  toolbarExtra?: React.ReactNode
  initialSort?: { key: string; dir: 'asc' | 'desc' }
}) {
  const [q, setQ] = React.useState('')
  const [sort, setSort] = React.useState<{ key: string; dir: 'asc' | 'desc' } | null>(initialSort ?? null)
  const [page, setPage] = React.useState(1)

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase()
    return search && term ? rows.filter((r) => search(r).toLowerCase().includes(term)) : rows
  }, [rows, q, search])

  const sorted = React.useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key)
    if (!col?.sort || !sort) return filtered
    const f = col.sort
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const x = f(a), y = f(b)
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true })) * dir
    })
  }, [filtered, sort, columns])

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, pages)
  const view = sorted.slice((current - 1) * pageSize, current * pageSize)

  return (
    <Card className="overflow-hidden">
      {(search || filters || toolbarExtra) && (
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          {search && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder={searchPlaceholder} className="pl-9" aria-label="Search" />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{filters}{toolbarExtra}</div>
        </div>
      )}
      <div className="scroll-thin overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-[11px] uppercase tracking-wider text-slate-400">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={cn('whitespace-nowrap px-4 py-3 font-medium', c.className)} aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {c.sort ? (
                    <button
                      className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-ink"
                      onClick={() => setSort((s) => (s?.key === c.key ? (s.dir === 'asc' ? { key: c.key, dir: 'desc' } : null) : { key: c.key, dir: 'asc' }))}
                    >
                      {c.header}
                      {sort?.key === c.key ? (sort.dir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
                    </button>
                  ) : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {view.map((row) => (
              <tr
                key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn('transition-colors', onRowClick && 'cursor-pointer hover:bg-navy-50/50')}
              >
                {columns.map((c) => <td key={c.key} className={cn('whitespace-nowrap px-4 py-3 align-middle', c.className)}>{c.render(row)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {view.length === 0 && <EmptyState title={empty?.title ?? 'No results'} description={empty?.description ?? 'Try adjusting your search or filters.'} />}
      {sorted.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-muted">
          <span>Showing {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, sorted.length)} of {sorted.length}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" aria-label="Previous page" disabled={current <= 1} onClick={() => setPage(current - 1)}><ChevronLeft className="size-4" /></Button>
            <span className="px-2 text-xs">Page {current} / {pages}</span>
            <Button variant="outline" size="icon" aria-label="Next page" disabled={current >= pages} onClick={() => setPage(current + 1)}><ChevronRight className="size-4" /></Button>
          </div>
        </div>
      )}
    </Card>
  )
}

/* ───────── Misc ───────── */
export function DemoBadge({ className }: { className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800', className)}><span className="size-1.5 rounded-full bg-amber-500" />DEMO MODE</span>
}

export function DescriptionList({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs uppercase tracking-wide text-muted">{k}</dt>
          <dd className="mt-0.5 break-words text-sm font-medium text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  )
}
