/**
 * Centralised demo "backend": one in-memory database persisted to LocalStorage.
 * - getDB()          read the current snapshot
 * - mutate(fn)       apply a change to a draft, persist it and notify subscribers
 * - useDB()          React hook — re-renders whenever the database changes
 * Changes made in another browser tab are picked up through the "storage" event.
 */
import { useSyncExternalStore } from 'react'
import type { DB, User } from '@/types'
import { createSeed, DB_VERSION } from '@/data/seed'

const KEY = 'cipm-lms-demo-db'
const SESSION_KEY = 'cipm-lms-demo-session'

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DB
      if (parsed.version === DB_VERSION) {
        // Each tab remembers its own signed-in user (sessionStorage) so the admin and
        // student portals can be demonstrated side by side; new tabs inherit the last session.
        const tabSession = sessionStorage.getItem(SESSION_KEY)
        if (tabSession) parsed.session = JSON.parse(tabSession) as DB['session']
        return parsed
      }
    }
  } catch {
    // corrupted storage — fall through to a fresh seed
  }
  const seed = createSeed()
  save(seed)
  return seed
}

let persistError: string | null = null
function save(db: DB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(db.session))
    persistError = null
  } catch {
    persistError = 'Browser storage is full or unavailable — changes will be lost on refresh.'
  }
}

let state: DB = load()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function getDB(): DB {
  return state
}

export function getPersistError() {
  return persistError
}

export function mutate<T = void>(fn: (draft: DB) => T): T {
  const draft = structuredClone(state)
  const result = fn(draft)
  state = draft
  save(state)
  emit()
  return result
}

export function replaceDB(next: DB) {
  state = next
  save(state)
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY || !e.newValue) return
    try {
      const next = JSON.parse(e.newValue) as DB
      // each tab keeps its own signed-in user so admin and student can be open side by side
      next.session = state.session
      state = next
      emit()
    } catch {
      // ignore malformed cross-tab payloads
    }
  })
}

/** Subscribe to the whole database. Derive what you need with useMemo(..., [db]). */
export function useDB(): DB {
  return useSyncExternalStore(subscribe, getDB)
}

export function useCurrentUser(): User | null {
  const db = useDB()
  return db.users.find((u) => u.id === db.session.userId) ?? null
}
