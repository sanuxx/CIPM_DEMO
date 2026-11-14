import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { useDB } from '@/store/db'
import { deleteCourse, saveCourse } from '@/store/actions'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Switch, Textarea, useConfirm } from '@/components/ui'
import { CoverArt } from '@/components/common'
import { fileToDataUrl } from '@/lib/files'
import { formatLKR, uid } from '@/lib/utils'
import { getCourseLessons, getCourseModules } from '@/lib/progress'
import type { Course } from '@/types'

const schema = z.object({
  title: z.string().trim().min(5, 'Enter a course title'),
  subtitle: z.string().trim().min(3, 'Enter a subtitle'),
  code: z.string().trim().min(2, 'Enter a short code').max(8, 'Use 8 characters or fewer'),
  description: z.string().trim().min(30, 'Describe the course in at least 30 characters'),
  fee: z.coerce.number().min(0, 'Fee cannot be negative'),
  durationMonths: z.coerce.number().int().min(1, 'At least 1 month').max(60),
  level: z.string().min(1),
  outcomes: z.string().trim().min(5, 'Add at least one learning outcome'),
})
type Values = z.input<typeof schema>

export default function AdminCourses() {
  const db = useDB()
  const [editing, setEditing] = useState<Course | 'new' | null>(null)
  const [confirm, dialog] = useConfirm()

  return (
    <>
      <PageHeader title="Courses" description="Create and manage courses. The portal supports multiple courses." actions={<Button onClick={() => setEditing('new')}><Plus className="size-4" />New course</Button>} />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {db.courses.map((c) => (
          <Card key={c.id} className="flex flex-col overflow-hidden">
            <div className="aspect-[16/8]"><CoverArt seed={c.id} label={c.title} src={c.thumbnail} /></div>
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center gap-2"><Badge tone={c.published ? 'green' : 'slate'}>{c.published ? 'Published' : 'Draft'}</Badge><Badge tone="navy">{c.code}</Badge></div>
              <h2 className="mt-2 font-semibold leading-snug">{c.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{c.description}</p>
              <p className="mt-3 text-sm text-slate-600">{formatLKR(c.fee)} · {c.durationMonths} months · {getCourseModules(db, c.id, false).length} modules · {getCourseLessons(db, c.id, false).length} lessons</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <Button size="sm" variant="outline" onClick={() => setEditing(c)}><Pencil className="size-3.5" />Edit</Button>
                <Button size="sm" variant="outline" onClick={() => { saveCourse({ ...c, published: !c.published }); toast.success(c.published ? 'Course unpublished' : 'Course published') }}>{c.published ? <><EyeOff className="size-3.5" />Unpublish</> : <><Eye className="size-3.5" />Publish</>}</Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => confirm({ title: 'Delete course?', description: `"${c.title}", its modules, lessons and quizzes will be permanently removed. Enrollments are kept.`, danger: true, confirmLabel: 'Delete', onConfirm: () => { deleteCourse(c.id); toast.success('Course deleted') } })}><Trash2 className="size-3.5" />Delete</Button>
              </div>
            </div>
          </Card>
        ))}
        {db.courses.length === 0 && <div className="md:col-span-2 xl:col-span-3"><Card><EmptyState title="No courses" description="Create your first course." action={<Button onClick={() => setEditing('new')}>New course</Button>} /></Card></div>}
      </div>
      {editing && <CourseForm key={editing === 'new' ? 'new' : editing.id} course={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {dialog}
    </>
  )
}

function CourseForm({ course, onClose }: { course: Course | null; onClose: () => void }) {
  const [thumb, setThumb] = useState(course?.thumbnail)
  const [published, setPublished] = useState(course?.published ?? false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { register, handleSubmit, formState: { errors } } = useForm<Values, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: course
      ? { title: course.title, subtitle: course.subtitle, code: course.code, description: course.description, fee: course.fee, durationMonths: course.durationMonths, level: course.level, outcomes: course.outcomes.join('\n') }
      : { title: '', subtitle: '', code: '', description: '', fee: 85000, durationMonths: 6, level: 'Foundation', outcomes: '' },
  })
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={course ? 'Edit course' : 'New course'} size="lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="course-form">{course ? 'Save changes' : 'Create course'}</Button></>}>
      <form id="course-form" noValidate className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit((v) => {
        saveCourse({
          id: course?.id ?? uid('course'), createdAt: course?.createdAt ?? new Date().toISOString(), thumbnail: thumb, published,
          title: v.title, subtitle: v.subtitle, code: v.code.toUpperCase(), description: v.description, fee: v.fee, durationMonths: v.durationMonths, level: v.level,
          outcomes: v.outcomes.split('\n').map((s) => s.trim()).filter(Boolean),
        })
        toast.success(course ? 'Course updated' : 'Course created')
        onClose()
      })}>
        <Field label="Title" className="sm:col-span-2" error={errors.title?.message}><Input {...register('title')} /></Field>
        <Field label="Subtitle" error={errors.subtitle?.message}><Input {...register('subtitle')} /></Field>
        <Field label="Code" error={errors.code?.message}><Input {...register('code')} /></Field>
        <Field label="Description" className="sm:col-span-2" error={errors.description?.message}><Textarea rows={4} {...register('description')} /></Field>
        <Field label="Course fee (LKR)" error={errors.fee?.message}><Input type="number" min={0} step={500} {...register('fee')} /></Field>
        <Field label="Duration (months)" error={errors.durationMonths?.message}><Input type="number" min={1} {...register('durationMonths')} /></Field>
        <Field label="Level"><Select {...register('level')}><option>Foundation</option><option>Intermediate</option><option>Advanced</option></Select></Field>
        <Field label="Thumbnail" hint="PNG/JPG, up to 600 KB">
          <div className="flex items-center gap-3">
            <div className="h-12 w-20 overflow-hidden rounded-md border border-line"><CoverArt seed={course?.id ?? 'new'} src={thumb} /></div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; const r = await fileToDataUrl(f, { maxKb: 600, accept: /^image\// }); if (r.ok) setThumb(r.data); else toast.error(r.error) }} />
            <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}><ImagePlus className="size-3.5" />Upload</Button>
            {thumb && <Button type="button" size="sm" variant="ghost" onClick={() => setThumb(undefined)}>Remove</Button>}
          </div>
        </Field>
        <Field label="Learning outcomes" hint="One per line" className="sm:col-span-2" error={errors.outcomes?.message}><Textarea rows={5} {...register('outcomes')} /></Field>
        <div className="sm:col-span-2"><Switch checked={published} onChange={setPublished} label="Published" description="Published courses are visible to students and open for enrollment." /></div>
      </form>
    </Modal>
  )
}
