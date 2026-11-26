import * as React from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Download, ExternalLink, File, FileText, GraduationCap, Link2, Lock, Paperclip, Presentation, CheckCircle2, PlayCircle, CircleDot,
} from 'lucide-react'
import type { PaymentStatus, Resource, ResourceType } from '@/types'
import type { ModuleStatus } from '@/lib/progress'
import { cn, formatFileSize, hashString } from '@/lib/utils'
import { Badge, Button, Modal } from './ui'

export function Logo({ light, className }: { light?: boolean; className?: string }) {
  return (
    <Link to="/" className={cn('flex items-center gap-3', className)} aria-label="CIPM Learning Portal">
      <img src={`${import.meta.env.BASE_URL}earrow-logo-white.png`} alt="eArrow" className="h-10 w-auto rounded-md bg-navy-900 px-2.5 py-1.5" />
      <span className={cn('border-l pl-3 text-[10px] font-medium uppercase leading-tight tracking-[0.14em]', light ? 'border-white/30 text-navy-200' : 'border-line text-muted')}>Learning<br />Portal</span>
    </Link>
  )
}

/** Generated cover art (used when no thumbnail was uploaded). Deterministic per seed. */
export function CoverArt({ seed, label, className, src }: { seed: string; label?: string; className?: string; src?: string }) {
  if (src) return <img src={src} alt={label ?? ''} className={cn('size-full object-cover', className)} />
  const h = hashString(seed)
  const hue = 205 + (h % 40)
  const shapes = Array.from({ length: 5 }, (_, i) => ({ x: (h >>> (i * 3)) % 100, y: (h >>> (i * 2 + 1)) % 100, r: 14 + ((h >>> i) % 26) }))
  return (
    <div className={cn('relative size-full overflow-hidden', className)} style={{ background: `linear-gradient(135deg, hsl(${hue} 62% 22%), hsl(${hue + 20} 58% 34%))` }}>
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {shapes.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={0.05 + i * 0.015} />)}
        <path d="M0 78 Q25 66 50 76 T100 70 V100 H0Z" fill="white" opacity="0.07" />
      </svg>
      <GraduationCap className="absolute right-3 top-3 size-6 text-white/30" aria-hidden />
      {label && <span className="absolute bottom-2.5 left-3 right-3 line-clamp-2 text-sm font-semibold leading-snug text-white drop-shadow">{label}</span>}
    </div>
  )
}

/* ───────── Status badges ───────── */
export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, ['green' | 'amber' | 'red' | 'slate', string]> = {
    success: ['green', 'Paid'], pending: ['amber', 'Pending'], failed: ['red', 'Failed'], refunded: ['slate', 'Refunded'],
  }
  const [tone, label] = map[status]
  return <Badge tone={tone}>{label}</Badge>
}

export function ModuleStatusBadge({ status }: { status: ModuleStatus }) {
  const map = {
    locked: { tone: 'slate', label: 'Locked', icon: Lock },
    available: { tone: 'blue', label: 'Available', icon: CircleDot },
    in_progress: { tone: 'amber', label: 'In progress', icon: PlayCircle },
    completed: { tone: 'green', label: 'Completed', icon: CheckCircle2 },
  } as const
  const { tone, label, icon: Icon } = map[status]
  return <Badge tone={tone}><Icon className="size-3" />{label}</Badge>
}

export function AccountBadge({ status }: { status: 'active' | 'inactive' }) {
  return <Badge tone={status === 'active' ? 'green' : 'slate'}>{status === 'active' ? 'Active' : 'Inactive'}</Badge>
}

/* ───────── Files, preview and download ───────── */
export const RESOURCE_META: Record<ResourceType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  pdf: { label: 'PDF', icon: FileText, color: 'bg-red-50 text-red-600' },
  doc: { label: 'Word', icon: FileText, color: 'bg-sky-50 text-sky-600' },
  ppt: { label: 'PowerPoint', icon: Presentation, color: 'bg-orange-50 text-orange-600' },
  text: { label: 'Text', icon: File, color: 'bg-slate-100 text-slate-600' },
  link: { label: 'External link', icon: Link2, color: 'bg-violet-50 text-violet-600' },
  attachment: { label: 'Attachment', icon: Paperclip, color: 'bg-emerald-50 text-emerald-600' },
}

export function ResourceIcon({ type, className }: { type: ResourceType; className?: string }) {
  const m = RESOURCE_META[type]
  return <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', m.color, className)}><m.icon className="size-5" /></span>
}

export function resourceMeta(r: Resource) {
  return r.type === 'link' ? 'External link' : `${RESOURCE_META[r.type].label} · ${formatFileSize(r.sizeKb)}`
}

/** Downloads a plain-text rendering of the demo file (the demo has no real binary documents). */
export function downloadResource(r: Resource) {
  const ext = { pdf: 'pdf', doc: 'doc', ppt: 'ppt', text: 'txt', link: 'url', attachment: 'zip' }[r.type]
  const base = r.name.replace(/\.(pdf|docx?|pptx?|zip|txt)$/i, '')
  const text = `${r.name}\nDEMO FILE — sample content generated by the CIPM LMS demo.\n\n${r.body.replace(/^# /gm, '').trim()}\n`
  // Save as .txt: a real PDF/Office/ZIP container is not produced in the demo.
  void ext
  downloadBlob(`${base}.txt`, text, 'text/plain;charset=utf-8')
  toast.success('Download started', { description: 'Demo files download as plain-text summaries.' })
}

export function downloadBlob(filename: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function Rich({ body }: { body: string }) {
  return (
    <div className="space-y-3">
      {body.split(/\n{2,}/).map((block, i) => {
        if (block.startsWith('# ')) return <h4 key={i} className="pt-2 text-base font-semibold text-navy-900">{block.slice(2)}</h4>
        const lines = block.split('\n')
        if (lines.every((l) => l.startsWith('- '))) return <ul key={i} className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700">{lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}</ul>
        return <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{block}</p>
      })}
    </div>
  )
}

export function ResourceViewer({ resource, onClose, onOpened }: { resource: Resource | null; onClose: () => void; onOpened?: (r: Resource) => void }) {
  const [slide, setSlide] = React.useState(0)
  React.useEffect(() => {
    setSlide(0)
    if (resource) onOpened?.(resource)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource?.id])
  const slides = resource?.type === 'ppt' ? resource.body.split(/\n{2,}/) : []
  return (
    <Modal
      open={!!resource} onOpenChange={(o) => !o && onClose()} size="lg"
      title={resource?.name ?? ''} description={resource ? `${resourceMeta(resource)} · simulated document viewer` : undefined}
      footer={
        resource && (
          <>
            {resource.downloadable && <Button variant="outline" onClick={() => downloadResource(resource)}><Download className="size-4" />Download</Button>}
            <Button onClick={onClose}>Close</Button>
          </>
        )
      }
    >
      {resource?.type === 'ppt' ? (
        <div>
          <div className="flex aspect-video flex-col justify-center rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 p-8 text-white">
            {slides[slide].split('\n').map((line, i) =>
              i === 0 ? <h3 key={i} className="mb-3 text-2xl font-semibold">{line}</h3>
                : <p key={i} className="text-sm leading-relaxed text-navy-100">{line.startsWith('- ') ? `• ${line.slice(2)}` : line}</p>)}
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-muted">
            <Button size="sm" variant="outline" disabled={slide === 0} onClick={() => setSlide(slide - 1)}>Previous</Button>
            <span>Slide {slide + 1} of {slides.length}</span>
            <Button size="sm" variant="outline" disabled={slide >= slides.length - 1} onClick={() => setSlide(slide + 1)}>Next</Button>
          </div>
        </div>
      ) : resource?.type === 'link' ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-700">{resource.body}</p>
          <p className="break-all rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{resource.url}</p>
          <a href={resource.url} target="_blank" rel="noreferrer noopener" className="inline-flex h-10 items-center gap-2 rounded-lg bg-navy-800 px-4 text-sm font-medium text-white hover:bg-navy-900">
            Open resource <ExternalLink className="size-4" />
          </a>
        </div>
      ) : resource ? (
        <div className="mx-auto max-w-prose rounded-xl border border-line bg-white p-6 shadow-inner sm:p-8"><Rich body={resource.body} /></div>
      ) : null}
    </Modal>
  )
}

export function RichText({ body }: { body: string }) {
  return <Rich body={body} />
}

/* ───────── CSV ───────── */
export function exportCSV(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n')
  downloadBlob(filename, '﻿' + csv, 'text/csv;charset=utf-8')
  toast.success('CSV exported', { description: `${rows.length} row${rows.length === 1 ? '' : 's'} saved to ${filename}` })
}
