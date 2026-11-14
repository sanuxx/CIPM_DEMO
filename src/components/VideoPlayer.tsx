import { useCallback, useEffect, useRef, useState } from 'react'
import { Maximize, Minimize, Pause, Play, RotateCcw, ShieldAlert, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react'
import type { Lesson } from '@/types'
import { Button } from './ui'
import { cn, formatDuration } from '@/lib/utils'

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

interface Props {
  lesson: Lesson
  startAt: number
  watermark?: string
  allowSpeed: boolean
  /** highest position already reached; used when forward seeking is restricted */
  maxPosition: number
  restrictForwardSeek: boolean
  /** enables the anti-download / anti-sharing / anti-capture deterrents */
  protect: boolean
  requiredPercent: number
  completed: boolean
  onPosition: (sec: number) => void
  onComplete: () => void
}

/**
 * Custom player. With a real video URL it drives an HTML5 <video>; without one it plays a
 * simulated lecture (key-point "slides" advance with the timeline) so the demo works offline.
 */
export function VideoPlayer({ lesson, startAt, watermark, allowSpeed, maxPosition, restrictForwardSeek, protect, requiredPercent, completed, onPosition, onComplete }: Props) {
  const { video } = lesson
  const real = !!video.url
  const wrap = useRef<HTMLDivElement>(null)
  const el = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState(video.durationSec)
  const [time, setTime] = useState(Math.min(startAt, video.durationSec))
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [rate, setRate] = useState(1)
  const [full, setFull] = useState(false)
  const [error, setError] = useState(false)
  const [ended, setEnded] = useState(false)
  // Protected playback: the real URL is fetched into a session-only blob so it is never written to the DOM.
  const [src, setSrc] = useState<string | null>(real && protect ? null : video.url || null)
  const [blocked, setBlocked] = useState<null | 'focus' | 'capture'>(null)
  const timeRef = useRef(time)
  timeRef.current = time
  const firedComplete = useRef(completed)
  const reachedRef = useRef(Math.max(maxPosition, startAt))

  const cb = useRef({ onPosition, onComplete })
  cb.current = { onPosition, onComplete }

  const check = useCallback((t: number, d: number) => {
    reachedRef.current = Math.max(reachedRef.current, t)
    if (!firedComplete.current && d > 0 && reachedRef.current >= d * (requiredPercent / 100)) {
      firedComplete.current = true
      cb.current.onComplete()
    }
  }, [requiredPercent])

  useEffect(() => {
    if (!real || !protect) { setSrc(video.url || null); return }
    let revoked = false
    let objectUrl = ''
    setSrc(null)
    fetch(video.url)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.blob() })
      .then((b) => { if (revoked) return; objectUrl = URL.createObjectURL(b); setSrc(objectUrl) })
      .catch(() => { if (!revoked) setError(true) })
    return () => { revoked = true; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [real, protect, video.url])

  const pauseNow = useCallback(() => {
    if (real) el.current?.pause()
    else setPlaying(false)
  }, [real])

  // Deterrents: pause when the window loses focus; blank the picture on PrintScreen / Win+Shift+S.
  useEffect(() => {
    if (!protect) return
    const lost = () => { pauseNow(); setBlocked('focus') }
    const vis = () => { if (document.hidden) lost() }
    const key = (e: KeyboardEvent) => {
      const snip = (e.metaKey || e.key === 'Meta') && e.shiftKey
      if (e.key === 'PrintScreen' || snip) {
        pauseNow(); setBlocked('capture')
        void navigator.clipboard?.writeText('Screen capture is disabled for protected videos.').catch(() => undefined)
      }
    }
    window.addEventListener('blur', lost)
    document.addEventListener('visibilitychange', vis)
    window.addEventListener('keyup', key)
    window.addEventListener('keydown', key)
    return () => { window.removeEventListener('blur', lost); document.removeEventListener('visibilitychange', vis); window.removeEventListener('keyup', key); window.removeEventListener('keydown', key) }
  }, [protect, pauseNow])

  // simulated clock
  useEffect(() => {
    if (real || !playing) return
    const id = setInterval(() => {
      setTime((t) => {
        const next = Math.min(duration, t + 0.25 * rate)
        if (next >= duration) { setPlaying(false); setEnded(true) }
        return next
      })
    }, 250)
    return () => clearInterval(id)
  }, [real, playing, rate, duration])

  useEffect(() => { check(time, duration) }, [time, duration, check])

  // persist position every 5s while playing, and on pause / unmount
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => cb.current.onPosition(Math.floor(timeRef.current)), 5000)
    return () => clearInterval(id)
  }, [playing])
  useEffect(() => () => cb.current.onPosition(Math.floor(timeRef.current)), [])

  useEffect(() => {
    const h = () => setFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  useEffect(() => {
    if (!el.current) return
    el.current.volume = volume
    el.current.muted = muted
    el.current.playbackRate = rate
  }, [volume, muted, rate])

  const toggle = () => {
    if (ended) { seek(0); setEnded(false) }
    if (real && el.current) {
      if (el.current.paused) void el.current.play().catch(() => setError(true)); else el.current.pause()
    } else setPlaying((p) => !p)
    if (playing) cb.current.onPosition(Math.floor(timeRef.current))
  }

  const seek = (t: number) => {
    const limit = restrictForwardSeek && !completed ? Math.max(reachedRef.current, 0) : duration
    const target = Math.max(0, Math.min(t, limit))
    setTime(target)
    setEnded(false)
    if (real && el.current) el.current.currentTime = target
  }

  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void wrap.current?.requestFullscreen?.()
  }

  // moving watermark
  const [wm, setWm] = useState({ x: 8, y: 10 })
  useEffect(() => {
    const id = setInterval(() => setWm({ x: 5 + Math.random() * 55, y: 8 + Math.random() * 70 }), 7000)
    return () => clearInterval(id)
  }, [])

  const stamp = new Date().toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
  const slides = lesson.keyPoints.length ? lesson.keyPoints : [lesson.title]
  const slideIdx = Math.min(slides.length - 1, Math.floor((time / Math.max(1, duration)) * slides.length))
  const pct = duration ? (time / duration) * 100 : 0
  const VolIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <div ref={wrap} onContextMenu={protect ? (e) => e.preventDefault() : undefined} className={cn('overflow-hidden rounded-xl bg-navy-950 text-white', protect && 'select-none', full && 'flex flex-col rounded-none')}>
      <div className={cn('group relative bg-black', full ? 'flex-1' : 'aspect-video')}>
        {real ? (
          error ? (
            <div className="flex size-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-navy-200"><ShieldAlert className="size-8" />This video could not be loaded. Check the video URL in the admin portal.</div>
          ) : (
            <video
              ref={el} src={src ?? undefined} className="size-full bg-black object-contain" playsInline onClick={toggle}
              controlsList="nodownload noremoteplayback noplaybackrate" disablePictureInPicture disableRemotePlayback draggable={false}
              onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration || video.durationSec); if (startAt > 0) e.currentTarget.currentTime = startAt }}
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
              onPlay={() => setPlaying(true)} onPause={() => { setPlaying(false); cb.current.onPosition(Math.floor(timeRef.current)) }}
              onEnded={() => { setPlaying(false); setEnded(true) }} onError={() => setError(true)}
            />
          )
        ) : (
          <button onClick={toggle} className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-8 text-center" aria-label={playing ? 'Pause' : 'Play'}>
            <span className="text-xs uppercase tracking-[0.2em] text-navy-300">Simulated lecture · {video.title}</span>
            <span key={slideIdx} className="mt-4 max-w-xl animate-in fade-in text-xl font-semibold leading-snug sm:text-3xl">{slides[slideIdx]}</span>
            <span className="mt-3 text-xs text-navy-300">Key point {slideIdx + 1} of {slides.length}</span>
            {!playing && <span className="absolute flex size-16 items-center justify-center rounded-full bg-white/90 text-navy-900 shadow-pop">{ended ? <RotateCcw className="size-7" /> : <Play className="size-7 translate-x-0.5" />}</span>}
          </button>
        )}
        {real && protect && !src && !error && <div className="absolute inset-0 flex items-center justify-center bg-black text-sm text-navy-200">Preparing secure playback…</div>}
        {watermark && (
          <>
            {/* tiled, low-contrast pattern: traceable in any screenshot or recording */}
            <div className="pointer-events-none absolute inset-0 grid select-none grid-cols-3 grid-rows-4 overflow-hidden" aria-hidden>
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} className="flex -rotate-12 items-center justify-center whitespace-nowrap text-[11px] font-medium text-white/[0.12]">{watermark} · {stamp}</span>
              ))}
            </div>
            <span className="pointer-events-none absolute select-none whitespace-nowrap rounded bg-black/20 px-1.5 py-0.5 text-xs font-medium text-white/45 transition-all duration-[3000ms]" style={{ left: `${wm.x}%`, top: `${wm.y}%` }}>
              {watermark}
            </span>
          </>
        )}
        {blocked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black p-6 text-center">
            <ShieldAlert className="size-9 text-accent-500" />
            <p className="max-w-sm text-sm text-navy-100">{blocked === 'capture' ? 'Screen capture is not permitted for this video. Playback has been paused.' : 'Playback paused because this window lost focus.'}</p>
            <Button size="sm" variant="accent" onClick={() => setBlocked(null)}>Resume viewing</Button>
          </div>
        )}
      </div>

      <div className="space-y-2 bg-navy-950 px-3 pb-3 pt-2">
        <input
          type="range" min={0} max={Math.max(1, duration)} step={0.1} value={time} onChange={(e) => seek(Number(e.target.value))} aria-label="Playback position"
          className="h-1.5 w-full cursor-pointer accent-accent-500" style={{ background: `linear-gradient(to right, #f59e0b ${pct}%, #334155 ${pct}%)` }}
        />
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause className="size-5" /> : <Play className="size-5" />}</Button>
          <span className="font-mono text-xs tabular-nums text-navy-100">{formatDuration(time)} / {formatDuration(duration)}</span>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Unmute' : 'Mute'} className="rounded p-1.5 hover:bg-white/10"><VolIcon className="size-4" /></button>
            <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false) }} aria-label="Volume" className="hidden h-1 w-20 accent-white sm:block" />
            {allowSpeed && (
              <select value={rate} onChange={(e) => setRate(Number(e.target.value))} aria-label="Playback speed" className="rounded bg-white/10 px-1.5 py-1 text-xs text-white outline-none">
                {SPEEDS.map((s) => <option key={s} value={s} className="text-ink">{s}×</option>)}
              </select>
            )}
            {!completed && !real && <Button variant="ghost" size="sm" className="text-xs text-navy-200 hover:bg-white/10" onClick={() => { setTime(duration); setPlaying(false); setEnded(true) }}><SkipForward className="size-3.5" /><span className="hidden sm:inline">Skip to end (demo)</span></Button>}
            <button onClick={toggleFull} aria-label={full ? 'Exit fullscreen' : 'Fullscreen'} className="rounded p-1.5 hover:bg-white/10">{full ? <Minimize className="size-4" /> : <Maximize className="size-4" />}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
