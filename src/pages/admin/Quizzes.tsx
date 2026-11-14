import { useState } from 'react'
import { toast } from 'sonner'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { useDB } from '@/store/db'
import { deleteQuiz } from '@/store/actions'
import { Badge, Button, DataTable, Modal, PageHeader, Select, useConfirm } from '@/components/ui'
import { QuizEditor } from '@/components/QuizEditor'
import { QuizRunner } from '@/components/QuizRunner'
import type { Quiz } from '@/types'

export default function AdminQuizzes() {
  const db = useDB()
  const [editing, setEditing] = useState<Quiz | 'new' | null>(null)
  const [previewing, setPreviewing] = useState<Quiz | null>(null)
  const [moduleId, setModuleId] = useState('all')
  const [confirm, dialog] = useConfirm()

  const rows = db.quizzes.map((q) => {
    const lesson = db.lessons.find((l) => l.quizIds.includes(q.id))
    const module = db.modules.find((m) => m.id === lesson?.moduleId)
    return { q, lesson, module }
  }).filter((r) => moduleId === 'all' || r.module?.id === moduleId).sort((a, b) => (a.module?.order ?? 99) - (b.module?.order ?? 99) || (a.lesson?.order ?? 0) - (b.lesson?.order ?? 0))

  return (
    <>
      <PageHeader title="Quizzes" description="Create and edit lesson assessments. Changes apply to students immediately." actions={<Button onClick={() => setEditing('new')}><Plus className="size-4" />New quiz</Button>} />
      <DataTable
        rows={rows} rowKey={(r) => r.q.id} search={(r) => `${r.q.title} ${r.lesson?.title ?? ''} ${r.module?.title ?? ''}`} searchPlaceholder="Search quizzes…" pageSize={10}
        filters={<Select value={moduleId} onChange={(e) => setModuleId(e.target.value)} aria-label="Filter by module" className="w-56"><option value="all">All modules</option>{[...db.modules].sort((a, b) => a.order - b.order).map((m) => <option key={m.id} value={m.id}>Module {m.order}</option>)}</Select>}
        columns={[
          { key: 'title', header: 'Quiz', render: (r) => <div><p className="font-medium">{r.q.title}</p><p className="text-xs text-muted">{r.lesson ? `M${r.module?.order} · ${r.lesson.title}` : 'Not attached to a lesson'}</p></div>, sort: (r) => r.q.title },
          { key: 'qs', header: 'Questions', render: (r) => r.q.questions.length, sort: (r) => r.q.questions.length },
          { key: 'marks', header: 'Marks', render: (r) => r.q.questions.reduce((s, x) => s + x.marks, 0) },
          { key: 'time', header: 'Time', render: (r) => (r.q.timeLimitMin ? `${r.q.timeLimitMin} min` : 'None') },
          { key: 'att', header: 'Attempts', render: (r) => (r.q.maxAttempts ? r.q.maxAttempts : <Badge>Default ({db.settings.maxQuizAttempts})</Badge>) },
          { key: 'sub', header: 'Submissions', render: (r) => db.attempts.filter((a) => a.quizId === r.q.id).length, sort: (r) => db.attempts.filter((a) => a.quizId === r.q.id).length },
          { key: 'act', header: '', className: 'text-right', render: (r) => (
            <div className="flex justify-end gap-1">
              <Button size="icon" variant="ghost" aria-label="Preview quiz" onClick={() => setPreviewing(r.q)}><Eye className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Edit quiz" onClick={() => setEditing(r.q)}><Pencil className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Delete quiz" className="text-red-600" onClick={() => confirm({ title: 'Delete quiz?', description: `"${r.q.title}" and all student attempts will be removed. Lessons with no quiz can be completed after materials and video.`, danger: true, confirmLabel: 'Delete', onConfirm: () => { deleteQuiz(r.q.id); toast.success('Quiz deleted') } })}><Trash2 className="size-4" /></Button>
            </div>
          ) },
        ]}
      />
      {editing && <QuizEditor key={editing === 'new' ? 'new' : editing.id} quiz={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      <Modal open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)} title="Quiz preview" description="Preview mode — no attempt is recorded." size="lg">
        {previewing && <QuizRunner quiz={previewing} lessonId="" userId="preview-admin" preview />}
      </Modal>
      {dialog}
    </>
  )
}
