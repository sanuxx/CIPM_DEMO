import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, Eye, EyeOff, Lock, Pencil, Plus, Trash2, Unlock } from 'lucide-react'
import { useDB } from '@/store/db'
import { deleteModule, reorderModules, saveModule } from '@/store/actions'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Switch, Textarea, useConfirm } from '@/components/ui'
import { getCourseModules, getModuleLessons } from '@/lib/progress'
import { uid } from '@/lib/utils'
import type { Module, Progression } from '@/types'

const schema = z.object({ title: z.string().trim().min(3, 'Enter a module title'), description: z.string().trim().min(10, 'Add a short description'), progression: z.enum(['sequential', 'independent']) })

export default function AdminModules() {
  const db = useDB()
  const [courseId, setCourseId] = useState(db.courses[0]?.id ?? '')
  const [editing, setEditing] = useState<Module | 'new' | null>(null)
  const [confirm, dialog] = useConfirm()
  const modules = getCourseModules(db, courseId, false)

  const move = (i: number, dir: -1 | 1) => {
    const ids = modules.map((m) => m.id)
    ;[ids[i], ids[i + dir]] = [ids[i + dir], ids[i]]
    reorderModules(ids)
  }

  return (
    <>
      <PageHeader title="Modules" description="Control order and progression. Sequential modules unlock one after another; independent modules are always open."
        actions={<><Select value={courseId} onChange={(e) => setCourseId(e.target.value)} aria-label="Course" className="w-64">{db.courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select><Button onClick={() => setEditing('new')} disabled={!courseId}><Plus className="size-4" />New module</Button></>} />
      <Card className="mb-5 p-4 text-sm text-slate-600">Progression is enforced from the module's <strong>order</strong> and <strong>progression</strong> setting: a sequential module stays locked until every earlier sequential module in the course is complete.</Card>
      <div className="space-y-3">
        {modules.map((m, i) => (
          <Card key={m.id} className="flex flex-wrap items-center gap-4 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-sm font-bold text-navy-800">{m.order}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{m.title}</h2>
                <Badge tone={m.progression === 'sequential' ? 'amber' : 'green'}>{m.progression === 'sequential' ? <Lock className="size-3" /> : <Unlock className="size-3" />}{m.progression === 'sequential' ? 'Sequential' : 'Independent'}</Badge>
                {!m.published && <Badge>Draft</Badge>}
              </div>
              <p className="mt-1 line-clamp-1 text-sm text-muted">{m.description}</p>
              <p className="mt-1 text-xs text-muted">{getModuleLessons(db, m.id, false).length} lessons</p>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Move down" disabled={i === modules.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label={m.published ? 'Unpublish' : 'Publish'} onClick={() => { saveModule({ ...m, published: !m.published }); toast.success(m.published ? 'Module unpublished' : 'Module published') }}>{m.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button>
              <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setEditing(m)}><Pencil className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Delete" className="text-red-600" onClick={() => confirm({ title: 'Delete module?', description: `"${m.title}" and all of its lessons and quizzes will be removed. Student progress for these lessons is also deleted.`, danger: true, confirmLabel: 'Delete', onConfirm: () => { deleteModule(m.id); toast.success('Module deleted') } })}><Trash2 className="size-4" /></Button>
            </div>
          </Card>
        ))}
        {modules.length === 0 && <Card><EmptyState title="No modules" description="Add a module to start building the course." action={<Button onClick={() => setEditing('new')}>New module</Button>} /></Card>}
      </div>
      {editing && <ModuleForm key={editing === 'new' ? 'new' : editing.id} module={editing === 'new' ? null : editing} courseId={courseId} nextOrder={modules.length + 1} onClose={() => setEditing(null)} />}
      {dialog}
    </>
  )
}

function ModuleForm({ module, courseId, nextOrder, onClose }: { module: Module | null; courseId: string; nextOrder: number; onClose: () => void }) {
  const [published, setPublished] = useState(module?.published ?? true)
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema), defaultValues: { title: module?.title ?? '', description: module?.description ?? '', progression: module?.progression ?? 'independent' },
  })
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={module ? 'Edit module' : 'New module'}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="module-form">{module ? 'Save changes' : 'Create module'}</Button></>}>
      <form id="module-form" noValidate className="space-y-4" onSubmit={handleSubmit((v) => {
        saveModule({ id: module?.id ?? uid('mod'), courseId, order: module?.order ?? nextOrder, title: v.title, description: v.description, progression: v.progression as Progression, published })
        toast.success(module ? 'Module updated' : 'Module created'); onClose()
      })}>
        <Field label="Title" error={errors.title?.message}><Input {...register('title')} /></Field>
        <Field label="Description" error={errors.description?.message}><Textarea rows={3} {...register('description')} /></Field>
        <Field label="Progression" hint="Sequential modules unlock after the previous sequential module is complete."><Select {...register('progression')}><option value="sequential">Sequential</option><option value="independent">Independent</option></Select></Field>
        <Switch checked={published} onChange={setPublished} label="Published" description="Unpublished modules are hidden from students and ignored for completion." />
      </form>
    </Modal>
  )
}
