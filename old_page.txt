'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

// ─── Projects ─────────────────────────────────────────────────────────────────

const PROJECTS = [
  { id: 'p1', kind: 'photo' as const, title: 'Jazz Cafe',                 category: 'Live',      year: '2023–2026', color: '#C8432A' },
  { id: 'p2', kind: 'photo' as const, title: "BBC RuPaul's Drag Race UK", category: 'Cultural',  year: '2024',      color: '#F2B800' },
  { id: 'p3', kind: 'photo' as const, title: 'BAPE Store London',          category: 'Brand',     year: '2024',      color: '#1565C0' },
  { id: 'p4', kind: 'photo' as const, title: 'Westside Gunn',              category: 'Live',      year: '2025',      color: '#C8432A' },
  { id: 'p5', kind: 'photo' as const, title: 'Lomography',                 category: 'Editorial', year: '2024',      color: '#2E7D32' },
  { id: 'p6', kind: 'photo' as const, title: 'Roundhouse',                 category: 'Live',      year: '2025–2026', color: '#C8432A' },
  { id: 'p7', kind: 'photo' as const, title: 'South Facing Festival',      category: 'Live',      year: '2025',      color: '#C8432A' },
  { id: 'p8', kind: 'photo' as const, title: 'Pete Rock',                  category: 'Live',      year: '2025',      color: '#C8432A' },
]

// ─── Photo sizes + velocities ─────────────────────────────────────────────────
// Each photo has a size, aspect ratio, starting position, direction and speed.
// vx/vy in px/s — slow enough to feel like bubbles drifting through.
// vrot in deg/s — very slight rotation as it floats.

const PHOTO_CFG: Record<string, {
  w: number; aspect: string; rot: number;
  xPct: number; yPct: number;
  vx: number; vy: number; vrot: number;
}> = {
  p1: { w: 300, aspect: '4/5',  rot: -2,   xPct:  0.10, yPct: 0.18, vx:  22, vy:   9, vrot:  0.04 },
  p2: { w: 440, aspect: '16/9', rot:  1,   xPct:  0.50, yPct: 0.08, vx: -16, vy:  18, vrot: -0.03 },
  p3: { w: 290, aspect: '4/5',  rot: -1.5, xPct:  0.78, yPct: 0.35, vx:  18, vy: -12, vrot:  0.05 },
  p4: { w: 420, aspect: '3/2',  rot:  2,   xPct: -0.08, yPct: 0.50, vx:  20, vy:  -8, vrot: -0.04 },
  p5: { w: 320, aspect: '4/5',  rot: -3,   xPct:  0.28, yPct: 0.62, vx: -18, vy: -14, vrot:  0.03 },
  p6: { w: 460, aspect: '16/9', rot:  1.5, xPct:  0.58, yPct: 0.70, vx:  12, vy: -20, vrot: -0.05 },
  p7: { w: 310, aspect: '4/5',  rot: -1,   xPct:  0.05, yPct: 0.80, vx: -22, vy:  10, vrot:  0.04 },
  p8: { w: 400, aspect: '3/2',  rot:  3,   xPct:  0.82, yPct: 0.75, vx: -10, vy: -18, vrot: -0.03 },
}

// ─── Letters ──────────────────────────────────────────────────────────────────

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const LETTERS = ALPHABET.map(ch => ({ id: `l${ch}`, kind: 'letter' as const, char: ch }))

// Letters float exactly like photos — velocity-based, wrap around edges.
// Smaller size (46px), slower speeds, all directions covered across A–Z.

const LETTER_GRID = [
  { xPct: 0.08, yPct: 0.10, rot: -14, vx:  16, vy:   8, vrot:  0.08 }, // A
  { xPct: 0.20, yPct: 0.08, rot:   8, vx: -12, vy:  15, vrot: -0.06 }, // B
  { xPct: 0.36, yPct: 0.12, rot:  -4, vx:  18, vy: -10, vrot:  0.10 }, // C
  { xPct: 0.50, yPct: 0.09, rot:  11, vx:  -8, vy:  18, vrot: -0.07 }, // D
  { xPct: 0.65, yPct: 0.11, rot:  -8, vx:  14, vy:  12, vrot:  0.09 }, // E
  { xPct: 0.82, yPct: 0.08, rot:  16, vx: -16, vy:   9, vrot: -0.08 }, // F
  { xPct: 0.02, yPct: 0.30, rot:   6, vx:  20, vy: -13, vrot:  0.06 }, // G
  { xPct: 0.17, yPct: 0.28, rot: -11, vx: -14, vy: -11, vrot: -0.09 }, // H
  { xPct: 0.33, yPct: 0.32, rot:   3, vx:   9, vy:  17, vrot:  0.07 }, // I
  { xPct: 0.47, yPct: 0.27, rot: -15, vx:  17, vy: -15, vrot: -0.08 }, // J
  { xPct: 0.62, yPct: 0.30, rot:  12, vx: -11, vy:  14, vrot:  0.10 }, // K
  { xPct: 0.78, yPct: 0.29, rot:  -6, vx:  13, vy:   7, vrot: -0.06 }, // L
  { xPct: 0.90, yPct: 0.32, rot:   9, vx: -18, vy: -12, vrot:  0.08 }, // M
  { xPct: 0.05, yPct: 0.48, rot:  -7, vx:  15, vy:  10, vrot: -0.07 }, // N
  { xPct: 0.21, yPct: 0.46, rot:  13, vx:  -9, vy: -16, vrot:  0.09 }, // O
  { xPct: 0.37, yPct: 0.50, rot:  -2, vx:  19, vy:   8, vrot: -0.08 }, // P
  { xPct: 0.53, yPct: 0.47, rot:  10, vx: -13, vy:  13, vrot:  0.07 }, // Q
  { xPct: 0.68, yPct: 0.49, rot: -13, vx:  11, vy: -17, vrot: -0.09 }, // R
  { xPct: 0.85, yPct: 0.46, rot:   5, vx: -16, vy:  11, vrot:  0.06 }, // S
  { xPct: 0.10, yPct: 0.65, rot: -10, vx:  14, vy: -14, vrot: -0.08 }, // T
  { xPct: 0.25, yPct: 0.67, rot:   7, vx:  -8, vy:  19, vrot:  0.10 }, // U
  { xPct: 0.42, yPct: 0.64, rot:  -4, vx:  17, vy:   6, vrot: -0.07 }, // V
  { xPct: 0.58, yPct: 0.66, rot:  14, vx: -15, vy: -10, vrot:  0.08 }, // W
  { xPct: 0.74, yPct: 0.63, rot:  -9, vx:  10, vy:  15, vrot: -0.09 }, // X
  { xPct: 0.30, yPct: 0.82, rot:  11, vx: -12, vy: -13, vrot:  0.07 }, // Y
  { xPct: 0.55, yPct: 0.84, rot:  -6, vx:  16, vy: -11, vrot: -0.08 }, // Z
]

const LETTER_SIZE = 46

// ─── Speed constants ──────────────────────────────────────────────────────────
const PHOTO_SPEED  = 0.12   // photos: slow, dreamy drift
const LETTER_SPEED = 0.20   // letters: a touch faster than photos

const ALL_ITEMS = [...PROJECTS, ...LETTERS]

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItemMeta {
  id: string; kind: 'photo' | 'letter'
  width: number; initRot: number; initX: number; initY: number
  aspect?: string
}

interface LivePos {
  x: number; y: number; rot: number
  vx: number; vy: number; vrot: number   // live, mutable velocities
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [metas,    setMetas]    = useState<ItemMeta[] | null>(null)
  const [zOrders,  setZOrders]  = useState<Record<string, number>>({})
  const [topZ,     setTopZ]     = useState(40)
  const [lightbox, setLightbox] = useState<typeof PROJECTS[number] | null>(null)

  const elRefs   = useRef<Record<string, HTMLDivElement | null>>({})
  const posRef   = useRef<Record<string, LivePos>>({})
  const dragging = useRef(new Set<string>())
  const dragRef  = useRef({ id: null as string | null, ox: 0, oy: 0, startX: 0, startY: 0 })
  const rafRef   = useRef(0)
  const lastT    = useRef(0)

  // ── Mount ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const built: ItemMeta[] = []
    const zInit: Record<string, number> = {}

    PROJECTS.forEach((p, i) => {
      const cfg = PHOTO_CFG[p.id]
      const x = cfg.xPct * vw
      const y = Math.max(72, cfg.yPct * vh)
      posRef.current[p.id] = { x, y, rot: cfg.rot, vx: cfg.vx, vy: cfg.vy, vrot: cfg.vrot }
      built.push({ id: p.id, kind: 'photo', width: cfg.w, initRot: cfg.rot, initX: x, initY: y, aspect: cfg.aspect })
      zInit[p.id] = i + 1
    })

    LETTERS.forEach((l, i) => {
      const g = LETTER_GRID[i]
      const x = g.xPct * vw
      const y = Math.max(72, g.yPct * vh)
      posRef.current[l.id] = { x, y, rot: g.rot, vx: g.vx, vy: g.vy, vrot: g.vrot }
      built.push({ id: l.id, kind: 'letter', width: LETTER_SIZE, initRot: g.rot, initX: x, initY: y })
      zInit[l.id] = PROJECTS.length + i + 1
    })

    setMetas(built)
    setZOrders(zInit)
  }, [])

  // ── Apply initial positions ────────────────────────────────────────────────

  useEffect(() => {
    if (!metas) return
    metas.forEach(({ id }) => {
      const el  = elRefs.current[id]
      const pos = posRef.current[id]
      if (el && pos) {
        el.style.transform = `translate3d(${pos.x}px,${pos.y}px,0) rotate(${pos.rot}deg)`
      }
    })
  }, [metas])

  // ── Animation loop — direct DOM, no React re-renders ──────────────────────

  useEffect(() => {
    if (!metas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    lastT.current = performance.now()

    const tick = (now: number) => {
      const dt  = Math.min((now - lastT.current) / 1000, 0.1) // seconds, capped
      lastT.current = now

      const vw = window.innerWidth
      const vh = window.innerHeight

      // ── Photos: velocity-based drift ─────────────────────────────────────
      PROJECTS.forEach(({ id }) => {
        if (dragging.current.has(id)) return
        const pos = posRef.current[id]
        const cfg = PHOTO_CFG[id]
        const el  = elRefs.current[id]
        if (!pos || !el) return

        pos.x   += pos.vx   * dt * PHOTO_SPEED
        pos.y   += pos.vy   * dt * PHOTO_SPEED
        pos.rot += pos.vrot * dt * PHOTO_SPEED

        const margin = 60
        const pw = cfg.w
        const ph = cfg.w / (parseFloat(cfg.aspect.replace('/', '.')) || 1)
        if (pos.x > vw + margin)   pos.x = -pw - margin
        if (pos.x < -pw - margin)  pos.x = vw + margin
        if (pos.y > vh + margin)   pos.y = -ph - margin
        if (pos.y < -ph - margin)  pos.y = vh + margin

        el.style.transform = `translate3d(${pos.x}px,${pos.y}px,0) rotate(${pos.rot}deg)`
      })

      // ── Letters: velocity-based drift + wrap ─────────────────────────────
      LETTERS.forEach(({ id }) => {
        if (dragging.current.has(id)) return
        const pos = posRef.current[id]
        const el  = elRefs.current[id]
        if (!pos || !el) return

        pos.x   += pos.vx   * dt * LETTER_SPEED
        pos.y   += pos.vy   * dt * LETTER_SPEED
        pos.rot += pos.vrot * dt * LETTER_SPEED

        const margin = 20
        if (pos.x > vw + margin)            pos.x = -LETTER_SIZE - margin
        if (pos.x < -LETTER_SIZE - margin)  pos.x = vw + margin
        if (pos.y > vh + margin)            pos.y = -LETTER_SIZE - margin
        if (pos.y < -LETTER_SIZE - margin)  pos.y = vh + margin

        el.style.transform = `translate3d(${pos.x}px,${pos.y}px,0) rotate(${pos.rot}deg)`
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [metas])

  // ── Pointer events ────────────────────────────────────────────────────────

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const { id, ox, oy } = dragRef.current
      if (!id) return
      const nx = e.clientX - ox
      const ny = e.clientY - oy
      const pos = posRef.current[id]
      const el  = elRefs.current[id]
      if (pos) { pos.x = nx; pos.y = ny }
      if (el)  { el.style.transform = `translate3d(${nx}px,${ny}px,0) rotate(${pos?.rot ?? 0}deg)` }
    }

    const onUp = (e: PointerEvent) => {
      const { id, startX, startY } = dragRef.current
      if (id) {
        // Nothing extra needed — letters resume velocity from wherever they were dropped

        dragging.current.delete(id)

        const wasDrag = Math.hypot(e.clientX - startX, e.clientY - startY) > 5
        if (!wasDrag) {
          const photo = PROJECTS.find(p => p.id === id)
          if (photo) setLightbox(photo)
        }
      }
      dragRef.current.id = null
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup',   onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup',   onUp)
    }
  }, [])

  useEffect(() => {
    if (!lightbox) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null) }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [lightbox])

  const startDrag = (e: React.PointerEvent, id: string) => {
    e.preventDefault()
    const pos = posRef.current[id]
    if (!pos) return
    const newZ = topZ + 1
    setTopZ(newZ)
    setZOrders(prev => ({ ...prev, [id]: newZ }))
    dragRef.current = { id, ox: e.clientX - pos.x, oy: e.clientY - pos.y, startX: e.clientX, startY: e.clientY }
    dragging.current.add(id)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  return (
    <>
      <a href="#surface" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:font-display focus:text-xs focus:font-semibold focus:tracking-widest focus:uppercase focus:outline-none">
        Skip to content
      </a>

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-16 pointer-events-none">
        <Link href="/" aria-label="Nadim Kurimbokus — home"
          className="pointer-events-auto font-display font-semibold text-fg-default text-sm tracking-[0.22em] uppercase hover:text-accent transition-colors duration-150 focus-visible:outline-none focus-visible:text-accent">
          Nadim Kurimbokus
        </Link>
        <nav aria-label="Main navigation">
          <ul className="flex items-center gap-8 pointer-events-auto" role="list">
            {([
              { label: 'Work',    href: '/' },
              { label: 'About',  href: '/about' },
              { label: 'Contact', href: '/contact' },
            ] as const).map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className="font-display font-medium text-fg-muted text-xs tracking-[0.18em] uppercase hover:text-fg-default transition-colors duration-150 focus-visible:outline-none focus-visible:text-accent">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Surface */}
      <main id="surface" className="fixed inset-0 overflow-hidden" style={{ background: '#FFFFFF', touchAction: 'none' }}
        aria-label="Work — drag to explore, click a photo to view">

        {metas?.map(meta => {
          const data = ALL_ITEMS.find(a => a.id === meta.id)!
          return (
            <div
              key={meta.id}
              ref={el => { elRefs.current[meta.id] = el }}
              onPointerDown={e => startDrag(e, meta.id)}
              style={{
                position: 'absolute',
                left: 0, top: 0,
                width: meta.width,
                zIndex: zOrders[meta.id] ?? 1,
                cursor: data.kind === 'photo' ? 'pointer' : 'grab',
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                willChange: 'transform',
              }}
            >
              {data.kind === 'photo' ? (
                <div
                  style={{
                    width: '100%',
                    aspectRatio: meta.aspect,
                    backgroundColor: (data as typeof PROJECTS[0]).color + '28',
                  }}
                  title={`${(data as typeof PROJECTS[0]).title} — click to view`}
                />
              ) : (
                <Image
                  src={`/letters/${(data as typeof LETTERS[0]).char}.svg`}
                  alt={`Letter ${(data as typeof LETTERS[0]).char}`}
                  width={meta.width} height={meta.width}
                  draggable={false}
                  style={{ display: 'block', pointerEvents: 'none' }}
                />
              )}
            </div>
          )
        })}

        <p style={{ position: 'absolute', bottom: 24, left: 24, zIndex: 200, fontFamily: 'var(--font-body)', fontSize: 11, color: '#999', letterSpacing: '0.04em', pointerEvents: 'none' }}>
          Available for UK and EU touring. Press accreditation in place.
        </p>
        <Link href="/contact" style={{ position: 'absolute', bottom: 20, right: 24, zIndex: 200 }}
          className="bg-accent text-white font-display font-semibold text-xs tracking-[0.2em] uppercase px-5 py-3 hover:opacity-90 transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
          Enquire about a shoot
        </Link>
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div role="dialog" aria-modal="true" aria-label={lightbox.title}
          className="fixed inset-0 z-[500] flex items-center justify-center"
          style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', backgroundColor: 'rgba(255,255,255,0.80)' }}
          onClick={() => setLightbox(null)}>
          <div className="relative mx-8" style={{ maxWidth: 520, width: '100%' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)}
              className="absolute -top-9 right-0 font-display font-medium text-fg-muted text-xs tracking-[0.18em] uppercase hover:text-fg-default transition-colors duration-150 focus-visible:outline-none"
              aria-label="Close">
              Close ×
            </button>
            <div style={{ width: '100%', aspectRatio: PHOTO_CFG[lightbox.id]?.aspect ?? '4/5', backgroundColor: lightbox.color + '28' }} />
            <div style={{ marginTop: 16 }}>
              <p className="font-display font-semibold text-fg-default tracking-tight uppercase" style={{ fontSize: 22 }}>
                {lightbox.title}
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 6, alignItems: 'center' }}>
                <span className="font-display font-semibold" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: lightbox.color }}>
                  {lightbox.category}
                </span>
                <span className="font-body text-fg-muted" style={{ fontSize: 11 }}>{lightbox.year}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
