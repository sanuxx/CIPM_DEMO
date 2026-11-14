import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Eye, Lock } from 'lucide-react'
import { useStudent } from '@/store/hooks'
import { getCourseModules, getLessonAccess, getModuleLessons } from '@/lib/progress'
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select } from '@/components/ui'
import { ResourceIcon, ResourceViewer, downloadResource, resourceMeta } from '@/components/common'
import { markResourceViewed } from '@/store/actions'
import type { Resource, ResourceType } from '@/types'

export default function Materials() {
  const { db, user, course } = useStudent()
  const [q, setQ] = useState('')
  const [type, setType] = useState<'all' | ResourceType>('all')
  const [viewing, setViewing] = useState<{ r: Resource; lessonId: string } | null>(null)

  const groups = useMemo(() => {
    if (!course) return []
    return getCourseModules(db, course.id).map((m) => ({
      module: m,
      items: getModuleLessons(db, m.id).flatMap((l) => {
        const locked = getLessonAccess(db, user.id, l).locked
        return l.resources
          .filter((r) => (type === 'all' || r.type === type) && r.name.toLowerCase().includes(q.trim().toLowerCase()))
          .map((r) => ({ r, lesson: l, locked }))
      }),
    })).filter((g) => g.items.length)
  }, [db, course, user.id, q, type])

  return (
    <>
      <PageHeader title="Learning materials" description="Every document and resource for lessons you can access." />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search materials…" aria-label="Search materials" className="sm:max-w-xs" />
        <Select value={type} onChange={(e) => setType(e.target.value as 'all' | ResourceType)} aria-label="Filter by type" className="sm:w-48">
          <option value="all">All file types</option><option value="pdf">PDF</option><option value="doc">Word</option><option value="ppt">PowerPoint</option><option value="text">Text</option><option value="link">External links</option><option value="attachment">Attachments</option>
        </Select>
      </div>
      <div className="space-y-5">
        {groups.map(({ module, items }) => (
          <Card key={module.id}>
            <div className="border-b border-line px-5 py-3.5 text-sm font-semibold">Module {module.order}: {module.title}</div>
            <ul className="divide-y divide-line">
              {items.map(({ r, lesson, locked }) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <ResourceIcon type={r.type} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{r.name}</p><p className="text-xs text-muted">{resourceMeta(r)} · <Link to={`/app/learn/${lesson.id}`} className="hover:underline">{lesson.title}</Link></p></div>
                  {locked ? <Badge><Lock className="size-3" />Locked</Badge> : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setViewing({ r, lessonId: lesson.id })}><Eye className="size-3.5" />{r.type === 'link' ? 'Open' : 'Preview'}</Button>
                      {r.downloadable && <Button size="sm" variant="ghost" aria-label={`Download ${r.name}`} onClick={() => downloadResource(r)}><Download className="size-3.5" /></Button>}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        ))}
        {groups.length === 0 && <Card><EmptyState title="No materials found" description="Try a different search or file type." /></Card>}
      </div>
      <ResourceViewer resource={viewing?.r ?? null} onClose={() => setViewing(null)} onOpened={(r) => viewing && markResourceViewed(user.id, viewing.lessonId, r.id)} />
    </>
  )
}
