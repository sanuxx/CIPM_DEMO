import { useState } from 'react'
import { toast } from 'sonner'
import { Megaphone, Pencil, Plus, Trash2 } from 'lucide-react'
import { useDB } from '@/store/db'
import { deleteAnnouncement, saveAnnouncement } from '@/store/actions'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Switch, Textarea, useConfirm } from '@/components/ui'
import { formatDate, uid } from '@/lib/utils'
import type { Announcement } from '@/types'

export default function AdminAnnouncements() {
  const db = useDB()
  const [editing, setEditing] = useState<Announcement | 'new' | null>(null)
  const [confirm, dialog] = useConfirm()
  const list = [...db.announcements].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <>
      <PageHeader title="Announcements" description="Published announcements appear on the student dashboard and announcements page." actions={<Button onClick={() => setEditing('new')}><Plus className="size-4" />New announcement</Button>} />
      <div className="space-y-3">
        {list.map((a) => (
          <Card key={a.id} className="flex flex-wrap items-start gap-4 p-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{a.title}</h2><Badge tone={a.published ? 'green' : 'slate'}>{a.published ? 'Published' : 'Draft'}</Badge><Badge tone="navy" className="capitalize">{a.category}</Badge>
                <Badge tone="blue">{a.audience === 'all' ? 'All students' : `${a.intakeIds.length} intake${a.intakeIds.length === 1 ? '' : 's'}`}</Badge></div>
              <p className="mt-1.5 text-sm text-slate-600">{a.body}</p>
              <p className="mt-2 text-xs text-muted">{formatDate(a.createdAt)}</p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => { saveAnnouncement({ ...a, published: !a.published }); toast.success(a.published ? 'Announcement unpublished' : 'Announcement published') }}>{a.published ? 'Unpublish' : 'Publish'}</Button>
              <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setEditing(a)}><Pencil className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Delete" className="text-red-600" onClick={() => confirm({ title: 'Delete announcement?', description: `"${a.title}" will be removed for all students.`, danger: true, confirmLabel: 'Delete', onConfirm: () => { deleteAnnouncement(a.id); toast.success('Announcement deleted') } })}><Trash2 className="size-4" /></Button>
            </div>
          </Card>
        ))}
        {list.length === 0 && <Card><EmptyState icon={Megaphone} title="No announcements" action={<Button onClick={() => setEditing('new')}>New announcement</Button>} /></Card>}
      </div>
      {editing && <Form key={editing === 'new' ? 'new' : editing.id} item={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {dialog}
    </>
  )
}

function Form({ item, onClose }: { item: Announcement | null; onClose: () => void }) {
  const db = useDB()
  const [title, setTitle] = useState(item?.title ?? '')
  const [body, setBody] = useState(item?.body ?? '')
  const [category, setCategory] = useState<Announcement['category']>(item?.category ?? 'general')
  const [audience, setAudience] = useState<Announcement['audience']>(item?.audience ?? 'all')
  const [intakeIds, setIntakeIds] = useState<string[]>(item?.intakeIds ?? [])
  const [published, setPublished] = useState(item?.published ?? true)
  const [err, setErr] = useState<Record<string, string>>({})
  const intakes = [...db.intakes].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14)

  const save = () => {
    const e: Record<string, string> = {}
    if (title.trim().length < 4) e.title = 'Enter a title'
    if (body.trim().length < 10) e.body = 'Write the announcement (at least 10 characters)'
    if (audience === 'intakes' && intakeIds.length === 0) e.intakes = 'Select at least one intake'
    setErr(e)
    if (Object.keys(e).length) return
    saveAnnouncement({ id: item?.id ?? uid('ann'), title: title.trim(), body: body.trim(), category, audience, intakeIds: audience === 'all' ? [] : intakeIds, published, createdAt: item?.createdAt ?? new Date().toISOString() })
    toast.success(item ? 'Announcement updated' : published ? 'Announcement published' : 'Draft saved'); onClose()
  }
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={item ? 'Edit announcement' : 'New announcement'} size="lg" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>{item ? 'Save changes' : published ? 'Publish' : 'Save draft'}</Button></>}>
      <div className="space-y-4">
        <Field label="Title" error={err.title}><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Message" error={err.body}><Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category"><Select value={category} onChange={(e) => setCategory(e.target.value as Announcement['category'])}><option value="general">General</option><option value="course">Course update</option><option value="enrollment">Enrollment</option></Select></Field>
          <Field label="Audience"><Select value={audience} onChange={(e) => setAudience(e.target.value as Announcement['audience'])}><option value="all">All students</option><option value="intakes">Selected intakes</option></Select></Field>
        </div>
        {audience === 'intakes' && (
          <Field label="Target intakes" error={err.intakes}>
            <div className="grid max-h-44 gap-1.5 overflow-y-auto rounded-lg border border-line p-3 sm:grid-cols-2">
              {intakes.map((i) => <label key={i.id} className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-navy-800" checked={intakeIds.includes(i.id)} onChange={() => setIntakeIds((s) => (s.includes(i.id) ? s.filter((x) => x !== i.id) : [...s, i.id]))} />{formatDate(i.date)}</label>)}
            </div>
          </Field>
        )}
        <Switch checked={published} onChange={setPublished} label="Published" description="Drafts are visible only to administrators." />
      </div>
    </Modal>
  )
}
