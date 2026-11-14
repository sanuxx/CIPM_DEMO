import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Lesson, Resource, ResourceType } from '@/types'
import { useDB } from '@/store/db'
import { deleteLesson, reorderLessons, saveLesson, deleteQuiz } from '@/store/actions'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Switch, Tabs, Textarea, useConfirm } from '@/components/ui'
import { QuizEditor } from '@/components/QuizEditor'
import { RESOURCE_META, ResourceIcon } from '@/components/common'
import { getModuleLessons } from '@/lib/progress'
import { formatDuration, uid } from '@/lib/utils'
import type { Quiz } from '@/types'

export default function AdminLessons() {
  const db = useDB()
  const mods = [...db.modules].sort((a, b) => a.order - b.order)
  const [moduleId, setModuleId] = useState(mods[0]?.id ?? '')
  const [editing, setEditing] = useState<Lesson | 'new' | null>(null)
  const [confirm, dialog] = useConfirm()
  const lessons = getModuleLessons(db, moduleId, false)

  const move = (i: number, d: -1 | 1) => {
    const ids = lessons.map((l) => l.id)
    ;[ids[i], ids[i + d]] = [ids[i + d], ids[i]]
    reorderLessons(ids)
  }

  return (
    <>
      <PageHeader title="Lessons" description="Each lesson has learning materials, a recorded video and one or more quizzes."
        actions={<><Select value={moduleId} onChange={(e) => setModuleId(e.target.value)} aria-label="Module" className="w-72">{mods.map((m) => <option key={m.id} value={m.id}>Module {m.order}: {m.title}</option>)}</Select><Button disabled={!moduleId} onClick={() => setEditing('new')}><Plus className="size-4" />New lesson</Button></>} />
      <div className="space-y-3">
        {lessons.map((l, i) => (
          <Card key={l.id} className="flex flex-wrap items-center gap-4 p-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-sm font-bold text-navy-800">{l.order}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{l.title}</h2>{!l.published && <Badge>Draft</Badge>}</div>
              <p className="mt-0.5 line-clamp-1 text-sm text-muted">{l.summary}</p>
              <p className="mt-1 text-xs text-muted">{l.resources.length} materials · video {formatDuration(l.video.durationSec)}{l.video.url ? '' : ' (simulated)'} · {l.quizIds.length} quiz{l.quizIds.length === 1 ? '' : 'zes'}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Move down" disabled={i === lessons.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label={l.published ? 'Unpublish' : 'Publish'} onClick={() => { saveLesson({ ...l, published: !l.published }); toast.success(l.published ? 'Lesson unpublished' : 'Lesson published') }}>{l.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button>
              <Button size="icon" variant="ghost" aria-label="Edit lesson" onClick={() => setEditing(l)}><Pencil className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Delete lesson" className="text-red-600" onClick={() => confirm({ title: 'Delete lesson?', description: `"${l.title}", its quizzes and student progress will be removed.`, danger: true, confirmLabel: 'Delete', onConfirm: () => { deleteLesson(l.id); toast.success('Lesson deleted') } })}><Trash2 className="size-4" /></Button>
            </div>
          </Card>
        ))}
        {lessons.length === 0 && <Card><EmptyState title="No lessons in this module" action={<Button onClick={() => setEditing('new')}>New lesson</Button>} /></Card>}
      </div>
      {editing && <LessonForm key={editing === 'new' ? 'new' : editing.id} lesson={editing === 'new' ? null : editing} moduleId={moduleId} nextOrder={lessons.length + 1} onClose={() => setEditing(null)} />}
      {dialog}
    </>
  )
}

function LessonForm({ lesson, moduleId, nextOrder, onClose }: { lesson: Lesson | null; moduleId: string; nextOrder: number; onClose: () => void }) {
  const db = useDB()
  const [tab, setTab] = useState<'details' | 'materials' | 'video' | 'quizzes'>('details')
  const [id] = useState(lesson?.id ?? uid('les'))
  const [title, setTitle] = useState(lesson?.title ?? '')
  const [summary, setSummary] = useState(lesson?.summary ?? '')
  const [content, setContent] = useState(lesson?.content ?? '')
  const [points, setPoints] = useState((lesson?.keyPoints ?? []).join('\n'))
  const [published, setPublished] = useState(lesson?.published ?? true)
  const [resources, setResources] = useState<Resource[]>(lesson?.resources ?? [])
  const [vTitle, setVTitle] = useState(lesson?.video.title ?? '')
  const [vUrl, setVUrl] = useState(lesson?.video.url ?? '')
  const [vMin, setVMin] = useState(Math.floor((lesson?.video.durationSec ?? 300) / 60))
  const [vSec, setVSec] = useState((lesson?.video.durationSec ?? 300) % 60)
  const [quizEdit, setQuizEdit] = useState<Quiz | 'new' | null>(null)
  const [confirm, dialog] = useConfirm()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const saved = db.lessons.find((l) => l.id === id)
  const attached = (saved?.quizIds ?? []).map((q) => db.quizzes.find((x) => x.id === q)).filter((q): q is Quiz => !!q)

  const setRes = (rid: string, patch: Partial<Resource>) => setResources((r) => r.map((x) => (x.id === rid ? { ...x, ...patch } : x)))
  const addRes = (type: ResourceType) => setResources((r) => [...r, { id: uid('res'), name: '', type, sizeKb: type === 'link' ? 0 : 250, url: type === 'link' ? 'https://' : undefined, body: '', downloadable: type !== 'link' }])

  const save = () => {
    const e: Record<string, string> = {}
    if (title.trim().length < 3) e.title = 'Enter a lesson title'
    if (summary.trim().length < 5) e.summary = 'Add a short summary'
    const badRes = resources.findIndex((r) => !r.name.trim() || (r.type === 'link' && !/^https?:\/\/.+\..+/.test(r.url ?? '')))
    if (badRes >= 0) e.resources = `Material ${badRes + 1} needs a name${resources[badRes].type === 'link' ? ' and a valid http(s) URL' : ''}`
    if (vUrl.trim() && !/^https?:\/\/.+/.test(vUrl.trim())) e.video = 'Enter a valid video URL (https://…) or leave it blank for simulated playback'
    const dur = vMin * 60 + vSec
    if (dur < 10) e.video = 'Video duration must be at least 10 seconds'
    setErrors(e)
    if (Object.keys(e).length) { setTab(e.title || e.summary ? 'details' : e.resources ? 'materials' : 'video'); toast.error(Object.values(e)[0]); return }
    saveLesson({
      id, moduleId: lesson?.moduleId ?? moduleId, order: lesson?.order ?? nextOrder, published,
      title: title.trim(), summary: summary.trim(), content, keyPoints: points.split('\n').map((s) => s.trim()).filter(Boolean),
      resources: resources.map((r) => ({ ...r, name: r.name.trim(), body: r.body || `${r.name}\n\nSample content for this demo file.` })),
      video: { title: vTitle.trim() || `Lecture: ${title.trim()}`, url: vUrl.trim(), durationSec: dur },
      quizIds: db.lessons.find((l) => l.id === id)?.quizIds ?? lesson?.quizIds ?? [],
    })
    toast.success(lesson ? 'Lesson updated' : 'Lesson created')
    onClose()
  }

  return (
    <>
      <Modal open onOpenChange={(o) => !o && onClose()} title={lesson ? 'Edit lesson' : 'New lesson'} size="xl"
        footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>{lesson ? 'Save changes' : 'Create lesson'}</Button></>}>
        <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ id: 'details', label: 'Details' }, { id: 'materials', label: 'Materials', count: resources.length }, { id: 'video', label: 'Video' }, { id: 'quizzes', label: 'Quizzes', count: attached.length }]} />

        {tab === 'details' && (
          <div className="space-y-4">
            <Field label="Lesson title" error={errors.title}><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
            <Field label="Summary" error={errors.summary}><Textarea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} /></Field>
            <Field label="Lesson notes" hint="Lines starting with “# ” become headings; separate paragraphs with a blank line."><Textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} /></Field>
            <Field label="Key points" hint="One per line — shown beside the lesson and as the simulated lecture slides."><Textarea rows={4} value={points} onChange={(e) => setPoints(e.target.value)} /></Field>
            <Switch checked={published} onChange={setPublished} label="Published" description="Unpublished lessons are hidden from students and do not count towards completion." />
          </div>
        )}

        {tab === 'materials' && (
          <div className="space-y-4">
            {errors.resources && <p role="alert" className="text-sm font-medium text-red-600">{errors.resources}</p>}
            {resources.map((r, i) => (
              <Card key={r.id} className="space-y-3 p-4">
                <div className="flex items-start gap-3">
                  <ResourceIcon type={r.type} />
                  <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_10rem_7rem]">
                    <Input placeholder="File name or title" aria-label="Material name" value={r.name} onChange={(e) => setRes(r.id, { name: e.target.value })} />
                    <Select aria-label="Material type" value={r.type} onChange={(e) => setRes(r.id, { type: e.target.value as ResourceType, downloadable: e.target.value !== 'link' })}>{(Object.keys(RESOURCE_META) as ResourceType[]).map((t) => <option key={t} value={t}>{RESOURCE_META[t].label}</option>)}</Select>
                    {r.type !== 'link' ? <Input type="number" min={1} aria-label="Size in KB" placeholder="KB" value={r.sizeKb} onChange={(e) => setRes(r.id, { sizeKb: Math.max(1, Number(e.target.value) || 1) })} /> : <span />}
                  </div>
                  <Button size="icon" variant="ghost" aria-label={`Remove material ${i + 1}`} className="text-red-600" onClick={() => setResources((x) => x.filter((y) => y.id !== r.id))}><Trash2 className="size-4" /></Button>
                </div>
                {r.type === 'link' && <Input placeholder="https://…" aria-label="Link URL" value={r.url ?? ''} onChange={(e) => setRes(r.id, { url: e.target.value })} />}
                <Textarea rows={3} aria-label="Preview content" placeholder={r.type === 'ppt' ? 'Slide text — separate slides with a blank line; first line of each slide is its title' : 'Preview text shown in the document viewer'} value={r.body} onChange={(e) => setRes(r.id, { body: e.target.value })} />
                {r.type !== 'link' && <Switch checked={r.downloadable} onChange={(v) => setRes(r.id, { downloadable: v })} label="Allow students to download" />}
              </Card>
            ))}
            {resources.length === 0 && <EmptyState title="No learning materials" description="Students must open every material before the video unlocks." />}
            <div className="flex flex-wrap gap-2">{(Object.keys(RESOURCE_META) as ResourceType[]).map((t) => <Button key={t} size="sm" variant="outline" onClick={() => addRes(t)}><Plus className="size-3.5" />{RESOURCE_META[t].label}</Button>)}</div>
          </div>
        )}

        {tab === 'video' && (
          <div className="space-y-4">
            <Field label="Video title"><Input value={vTitle} placeholder={`Lecture: ${title}`} onChange={(e) => setVTitle(e.target.value)} /></Field>
            <Field label="Video URL" hint="Direct link to an .mp4 or .webm file. Leave blank to use the simulated lecture player." error={errors.video}><Input value={vUrl} placeholder="https://example.com/lecture.mp4" onChange={(e) => setVUrl(e.target.value)} /></Field>
            <div className="grid max-w-xs grid-cols-2 gap-3">
              <Field label="Minutes"><Input type="number" min={0} value={vMin} onChange={(e) => setVMin(Math.max(0, Number(e.target.value) || 0))} /></Field>
              <Field label="Seconds"><Input type="number" min={0} max={59} value={vSec} onChange={(e) => setVSec(Math.min(59, Math.max(0, Number(e.target.value) || 0)))} /></Field>
            </div>
            <p className="text-xs text-muted">With a real video URL the duration is read from the file once it loads; the value above is used until then.</p>
          </div>
        )}

        {tab === 'quizzes' && (
          <div className="space-y-4">
            {!saved ? (
              <EmptyState title="Save the lesson first" description="Create the lesson, then reopen it to add quizzes." />
            ) : (
              <>
                {attached.map((q) => (
                  <Card key={q.id} className="flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-0 flex-1"><p className="font-medium">{q.title}</p><p className="text-xs text-muted">{q.questions.length} questions · {q.timeLimitMin ? `${q.timeLimitMin} min` : 'untimed'} · {q.maxAttempts ?? `default (${db.settings.maxQuizAttempts})`} attempts</p></div>
                    <Button size="sm" variant="outline" onClick={() => setQuizEdit(q)}><Pencil className="size-3.5" />Edit</Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => confirm({ title: 'Delete quiz?', description: 'Attempts for this quiz will be removed.', danger: true, confirmLabel: 'Delete', onConfirm: () => { deleteQuiz(q.id); toast.success('Quiz deleted') } })}><Trash2 className="size-3.5" /></Button>
                  </Card>
                ))}
                {attached.length === 0 && <EmptyState title="No quizzes" description="Without a quiz the lesson completes after the video." />}
                <Button variant="outline" onClick={() => setQuizEdit('new')}><Plus className="size-4" />Add quiz</Button>
              </>
            )}
          </div>
        )}
      </Modal>
      {quizEdit && <QuizEditor key={quizEdit === 'new' ? 'new' : quizEdit.id} quiz={quizEdit === 'new' ? null : quizEdit} lessonId={id} onClose={() => setQuizEdit(null)} />}
      {dialog}
    </>
  )
}
