'use client'

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'

const useClientLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

interface PhysicsState {
  x: number; y: number; rot: number
  vx: number; vy: number; vrot: number
  baseVx: number; baseVy: number; baseVrot: number
}
interface DragState {
  id: string; ox: number; oy: number
  startX: number; startY: number
  px: number; py: number; nx: number; ny: number
}
interface Project {
  id: string; kind: 'photo'
  title: string; category: string; year: string
  color: string
  src: string | null        // cover shown on canvas tile
  gallery: string[]         // all images for this job — flip through in viewer
}

const LOGO_SIZE      = 360
const LETTER_SIZE    = 80
const DRAG_THRESHOLD = 8
const LOGO_INIT = { xPct: 0.4, yPct: 0.3, rot: -2, baseVx: 6, baseVy: 4, baseVrot: 0.2 }

const PHOTO_CFG: Record<string, {
  w: number; aspect: string; rot: number
  xPct: number; yPct: number
  baseVx: number; baseVy: number; baseVrot: number
}> = {
  // Brand 2025 — featured images are portrait (~1080x1600); galleries mix portrait + landscape
  b1: { w: 240, aspect: '1060/1600', rot:  1.5, xPct: 0.38, yPct: 0.22, baseVx:  -7, baseVy:   8, baseVrot:  0.22 },
  b2: { w: 240, aspect: '1082/1600', rot: -2,   xPct: 0.62, yPct: 0.45, baseVx:   8, baseVy:  -7, baseVrot: -0.28 },
  b3: { w: 240, aspect: '1079/1600', rot:  2.5, xPct: 0.22, yPct: 0.38, baseVx:  -9, baseVy:   6, baseVrot:  0.20 },
  // Cultural 2025 — Voice of Mauritius, mixed portrait + landscape gallery (8 images)
  c1: { w: 250, aspect: '1083/1600', rot: -2.5, xPct: 0.45, yPct: 0.85, baseVx:  11, baseVy:  -7, baseVrot: -0.24 },
  // Live — Julies Top 5 (landscape feature), Jazz Cafe Festival (landscape), Reyven Lenae @ Roundhouse (portrait)
  l1: { w: 360, aspect: '1600/1067', rot: -1.5, xPct: 0.82, yPct: 0.72, baseVx:  -8, baseVy:  -9, baseVrot:  0.22 },
  l2: { w: 340, aspect: '1600/1113', rot:  2,   xPct: 0.05, yPct: 0.42, baseVx: -10, baseVy:  11, baseVrot: -0.24 },
  l3: { w: 240, aspect: '1067/1600', rot: -2.5, xPct: 0.92, yPct: 0.20, baseVx:  12, baseVy:  -8, baseVrot:  0.25 },
}

// Per-image aspect ratios for brand galleries — used so the tile and the lightbox container
// can match whichever image is currently showing (galleries have mixed portrait + landscape)
const IMAGE_ASPECTS: Record<string, string> = {
  '/images/brand/sum-ldn/brand_2025_sum-ldn_fashion-shoot_001_standard.jpg': '1060/1600',
  '/images/brand/sum-ldn/brand_2025_sum-ldn_fashion-shoot_002_standard.jpg': '1233/1600',
  '/images/brand/sum-ldn/brand_2025_sum-ldn_fashion-shoot_003_standard.jpg': '1259/1600',
  '/images/brand/yosqi/brand_2025_yosqi_001_standard.jpg': '1600/1074',
  '/images/brand/yosqi/brand_2025_yosqi_002_standard.jpg': '1073/1600',
  '/images/brand/yosqi/brand_2025_yosqi_003_standard.jpg': '1074/1600',
  '/images/brand/yosqi/brand_2025_yosqi_004_standard.jpg': '1600/1070',
  '/images/brand/yosqi/brand_2025_yosqi_005_standard.jpg': '1600/1075',
  '/images/brand/yosqi/brand_2025_yosqi_006_standard.jpg': '1082/1600',
  '/images/brand/22impact/brand_2025_22impact_001_standard.jpg': '1073/1600',
  '/images/brand/22impact/brand_2025_22impact_002_standard.jpg': '1079/1600',
  '/images/brand/22impact/brand_2025_22impact_003_standard.jpg': '1084/1600',
  '/images/brand/22impact/brand_2025_22impact_004_standard.jpg': '1081/1600',
  '/images/brand/22impact/brand_2025_22impact_005_standard.jpg': '1600/1070',
  // Cultural — Voice of Mauritius
  '/images/cultural/voice-of-mauritius/cultural_2025_voice-of-mauritius_001_standard.jpg': '1083/1600',
  '/images/cultural/voice-of-mauritius/cultural_2025_voice-of-mauritius_002_standard.jpg': '1600/1083',
  '/images/cultural/voice-of-mauritius/cultural_2025_voice-of-mauritius_003_standard.jpg': '1077/1600',
  '/images/cultural/voice-of-mauritius/cultural_2025_voice-of-mauritius_004_standard.jpg': '1600/1081',
  '/images/cultural/voice-of-mauritius/cultural_2025_voice-of-mauritius_005_standard.jpg': '1600/1075',
  '/images/cultural/voice-of-mauritius/cultural_2025_voice-of-mauritius_006_standard.jpg': '1082/1600',
  '/images/cultural/voice-of-mauritius/cultural_2025_voice-of-mauritius_007_standard.jpg': '1600/1063',
  '/images/cultural/voice-of-mauritius/cultural_2025_voice-of-mauritius_008_standard.jpg': '1078/1600',
  // Live — Julies Top 5 (2026): mostly landscape, 003 + 008 are portrait
  '/images/live/julies-top-5/live_2026_julies-top-5_001_standard.jpg': '1600/1067',
  '/images/live/julies-top-5/live_2026_julies-top-5_002_standard.jpg': '1600/1067',
  '/images/live/julies-top-5/live_2026_julies-top-5_003_standard.jpg': '1067/1600',
  '/images/live/julies-top-5/live_2026_julies-top-5_004_standard.jpg': '1600/1067',
  '/images/live/julies-top-5/live_2026_julies-top-5_005_standard.jpg': '1600/1067',
  '/images/live/julies-top-5/live_2026_julies-top-5_006_standard.jpg': '1600/1067',
  '/images/live/julies-top-5/live_2026_julies-top-5_007_standard.jpg': '1600/1067',
  '/images/live/julies-top-5/live_2026_julies-top-5_008_standard.jpg': '1067/1600',
  '/images/live/julies-top-5/live_2026_julies-top-5_009_standard.jpg': '1600/1067',
  '/images/live/julies-top-5/live_2026_julies-top-5_010_standard.jpg': '1600/1067',
  // Live — Jazz Cafe Festival (2024): mixed; 005, 007, 009 are portrait
  '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_001_standard.jpg': '1600/1113',
  '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_002_standard.jpg': '1600/1105',
  '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_003_standard.jpg': '1600/1116',
  '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_004_standard.jpg': '1600/1105',
  '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_005_standard.jpg': '1112/1600',
  '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_006_standard.jpg': '1600/1110',
  '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_007_standard.jpg': '1110/1600',
  '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_008_standard.jpg': '1600/1127',
  '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_009_standard.jpg': '1110/1600',
  '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_010_standard.jpg': '1600/1117',
  // Live — Reyven Lenae @ Roundhouse (2025): mostly portrait; 003, 004 are landscape
  '/images/live/reyven-lenae-roundhouse/live_2025_reyven-lenae-roundhouse_001_standard.jpg': '1067/1600',
  '/images/live/reyven-lenae-roundhouse/live_2025_reyven-lenae-roundhouse_002_standard.jpg': '1067/1600',
  '/images/live/reyven-lenae-roundhouse/live_2025_reyven-lenae-roundhouse_003_standard.jpg': '1600/1067',
  '/images/live/reyven-lenae-roundhouse/live_2025_reyven-lenae-roundhouse_004_standard.jpg': '1600/1067',
  '/images/live/reyven-lenae-roundhouse/live_2025_reyven-lenae-roundhouse_005_standard.jpg': '1067/1600',
  '/images/live/reyven-lenae-roundhouse/live_2025_reyven-lenae-roundhouse_006_standard.jpg': '1067/1600',
  '/images/live/reyven-lenae-roundhouse/live_2025_reyven-lenae-roundhouse_007_standard.jpg': '1067/1600',
}

function getSrcAspect(src: string | null | undefined, fallback: string): string {
  if (!src) return fallback
  return IMAGE_ASPECTS[src] ?? fallback
}

// Tile dimensions for the canvas. Keeps the LONGER dimension constant regardless of orientation
// so a landscape gallery image gets a wide-short tile of similar visual weight to the portrait one,
// instead of shrinking to a tiny strip that holds the same width as the portrait tile.
function getTileDims(id: string, src: string | null | undefined): { w: number; h: number } {
  const cfg = PHOTO_CFG[id]
  if (!cfg) return { w: 200, h: 200 }
  const cfgAspectNum  = parseAspect(cfg.aspect)
  const currAspectNum = parseAspect(getSrcAspect(src, cfg.aspect))
  // Long dimension of the configured tile (height for portrait, width for landscape)
  const longDim = cfgAspectNum >= 1 ? cfg.w : Math.round(cfg.w / cfgAspectNum)
  if (currAspectNum >= 1) {
    // Landscape — long dim is width
    return { w: longDim, h: Math.round(longDim / currAspectNum) }
  }
  // Portrait — long dim is height
  return { w: Math.round(longDim * currAspectNum), h: longDim }
}

const LETTER_GRID = [
  { xPct: 0.15, yPct: 0.20, rot: -12, baseVx:  14, baseVy:   8, baseVrot:  0.70 },
  { xPct: 0.70, yPct: 0.25, rot:   9, baseVx: -12, baseVy:  13, baseVrot: -0.60 },
  { xPct: 0.42, yPct: 0.70, rot:  -8, baseVx:  13, baseVy: -11, baseVrot:  0.75 },
]
const LETTER_CHARS = ['A', 'B', 'C']

// Each float drifts toward a different edge so they feel like they physically leave the frame
const FLOAT_DRIFT = {
  logo: 'translate(-100px, -80px) scale(0.6)',
  lt0:  'translate(-90px, -65px) scale(0.55)',   // upper-left
  lt1:  'translate(90px,  -60px) scale(0.55)',   // upper-right
  lt2:  'translate(12px,   90px) scale(0.55)',   // downward
}

const PROJECTS: Project[] = [
  // Brand 2025
  {
    id: 'b1', kind: 'photo', title: 'Sum Ldn', category: 'Brand', year: '2025', color: '#1565C0',
    src: '/images/brand/sum-ldn/brand_2025_sum-ldn_fashion-shoot_001_standard.jpg',
    gallery: [
      '/images/brand/sum-ldn/brand_2025_sum-ldn_fashion-shoot_001_standard.jpg',
      '/images/brand/sum-ldn/brand_2025_sum-ldn_fashion-shoot_002_standard.jpg',
      '/images/brand/sum-ldn/brand_2025_sum-ldn_fashion-shoot_003_standard.jpg',
    ],
  },
  {
    id: 'b2', kind: 'photo', title: 'Yosqi', category: 'Brand', year: '2025', color: '#2C3E50',
    src: '/images/brand/yosqi/brand_2025_yosqi_006_standard.jpg',
    gallery: [
      '/images/brand/yosqi/brand_2025_yosqi_001_standard.jpg',
      '/images/brand/yosqi/brand_2025_yosqi_002_standard.jpg',
      '/images/brand/yosqi/brand_2025_yosqi_003_standard.jpg',
      '/images/brand/yosqi/brand_2025_yosqi_004_standard.jpg',
      '/images/brand/yosqi/brand_2025_yosqi_005_standard.jpg',
      '/images/brand/yosqi/brand_2025_yosqi_006_standard.jpg',
    ],
  },
  {
    id: 'b3', kind: 'photo', title: '22Impact', category: 'Brand', year: '2025', color: '#1A2B3C',
    src: '/images/brand/22impact/brand_2025_22impact_002_standard.jpg',
    gallery: [
      '/images/brand/22impact/brand_2025_22impact_001_standard.jpg',
      '/images/brand/22impact/brand_2025_22impact_002_standard.jpg',
      '/images/brand/22impact/brand_2025_22impact_003_standard.jpg',
      '/images/brand/22impact/brand_2025_22impact_004_standard.jpg',
      '/images/brand/22impact/brand_2025_22impact_005_standard.jpg',
    ],
  },
  // Cultural 2025
  {
    id: 'c1', kind: 'photo', title: 'Voice of Mauritius', category: 'Cultural', year: '2025', color: '#F2B800',
    src: '/images/cultural/voice-of-mauritius/cultural_2025_voice-of-mauritius_001_standard.jpg',
    gallery: [
      '/images/cultural/voice-of-mauritius/cultural_2025_voice-of-mauritius_001_standard.jpg',
      '/images/cultural/voice-of-mauritius/cultural_2025_voice-of-mauritius_002_standard.jpg',
      '/images/cultural/voice-of-mauritius/cultural_2025_voice-of-mauritius_003_standard.jpg',
      '/images/cultural/voice-of-mauritius/cultural_2025_voice-of-mauritius_004_standard.jpg',
      '/images/cultural/voice-of-mauritius/cultural_2025_voice-of-mauritius_005_standard.jpg',
      '/images/cultural/voice-of-mauritius/cultural_2025_voice-of-mauritius_006_standard.jpg',
      '/images/cultural/voice-of-mauritius/cultural_2025_voice-of-mauritius_007_standard.jpg',
      '/images/cultural/voice-of-mauritius/cultural_2025_voice-of-mauritius_008_standard.jpg',
    ],
  },
  // Live 2024–2026
  {
    id: 'l1', kind: 'photo', title: 'Julies Top 5 · Roundhouse', category: 'Live', year: '2026', color: '#C8432A',
    src: '/images/live/julies-top-5/live_2026_julies-top-5_001_standard.jpg',
    gallery: [
      '/images/live/julies-top-5/live_2026_julies-top-5_001_standard.jpg',
      '/images/live/julies-top-5/live_2026_julies-top-5_002_standard.jpg',
      '/images/live/julies-top-5/live_2026_julies-top-5_003_standard.jpg',
      '/images/live/julies-top-5/live_2026_julies-top-5_004_standard.jpg',
      '/images/live/julies-top-5/live_2026_julies-top-5_005_standard.jpg',
      '/images/live/julies-top-5/live_2026_julies-top-5_006_standard.jpg',
      '/images/live/julies-top-5/live_2026_julies-top-5_007_standard.jpg',
      '/images/live/julies-top-5/live_2026_julies-top-5_008_standard.jpg',
      '/images/live/julies-top-5/live_2026_julies-top-5_009_standard.jpg',
      '/images/live/julies-top-5/live_2026_julies-top-5_010_standard.jpg',
    ],
  },
  {
    id: 'l2', kind: 'photo', title: 'Jazz Cafe Festival', category: 'Live', year: '2024', color: '#C8432A',
    src: '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_001_standard.jpg',
    gallery: [
      '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_001_standard.jpg',
      '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_002_standard.jpg',
      '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_003_standard.jpg',
      '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_004_standard.jpg',
      '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_005_standard.jpg',
      '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_006_standard.jpg',
      '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_007_standard.jpg',
      '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_008_standard.jpg',
      '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_009_standard.jpg',
      '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_010_standard.jpg',
    ],
  },
  {
    id: 'l3', kind: 'photo', title: 'Reyven Lenae · Roundhouse', category: 'Live', year: '2025', color: '#C8432A',
    src: '/images/live/reyven-lenae-roundhouse/live_2025_reyven-lenae-roundhouse_001_standard.jpg',
    gallery: [
      '/images/live/reyven-lenae-roundhouse/live_2025_reyven-lenae-roundhouse_001_standard.jpg',
      '/images/live/reyven-lenae-roundhouse/live_2025_reyven-lenae-roundhouse_002_standard.jpg',
      '/images/live/reyven-lenae-roundhouse/live_2025_reyven-lenae-roundhouse_003_standard.jpg',
      '/images/live/reyven-lenae-roundhouse/live_2025_reyven-lenae-roundhouse_004_standard.jpg',
      '/images/live/reyven-lenae-roundhouse/live_2025_reyven-lenae-roundhouse_005_standard.jpg',
      '/images/live/reyven-lenae-roundhouse/live_2025_reyven-lenae-roundhouse_006_standard.jpg',
      '/images/live/reyven-lenae-roundhouse/live_2025_reyven-lenae-roundhouse_007_standard.jpg',
    ],
  },
]

function parseAspect(a: string): number {
  const [w, h] = a.split('/').map(Number); return w / h
}
function getDims(id: string): { w: number; h: number } {
  if (id === 'logo') return { w: LOGO_SIZE, h: LOGO_SIZE }
  if (id.startsWith('lt')) return { w: LETTER_SIZE, h: LETTER_SIZE }
  const cfg = PHOTO_CFG[id]
  if (!cfg) return { w: 200, h: 200 }
  return { w: cfg.w, h: Math.round(cfg.w / parseAspect(cfg.aspect)) }
}
function getRadius(id: string): number {
  const { w, h } = getDims(id); return Math.max(w, h) * 0.46
}
function buildInitialState(vw: number, vh: number): Record<string, PhysicsState> {
  const s: Record<string, PhysicsState> = {}
  s['logo'] = {
    x: LOGO_INIT.xPct*(vw-LOGO_SIZE), y: LOGO_INIT.yPct*(vh-LOGO_SIZE), rot: LOGO_INIT.rot,
    vx: LOGO_INIT.baseVx, vy: LOGO_INIT.baseVy, vrot: LOGO_INIT.baseVrot,
    baseVx: LOGO_INIT.baseVx, baseVy: LOGO_INIT.baseVy, baseVrot: LOGO_INIT.baseVrot,
  }
  PROJECTS.forEach(({ id }) => {
    const cfg = PHOTO_CFG[id]; if (!cfg) return
    const { w, h } = getDims(id)
    s[id] = {
      x: cfg.xPct*(vw-w), y: cfg.yPct*(vh-h), rot: cfg.rot,
      vx: cfg.baseVx, vy: cfg.baseVy, vrot: cfg.baseVrot,
      baseVx: cfg.baseVx, baseVy: cfg.baseVy, baseVrot: cfg.baseVrot,
    }
  })
  LETTER_GRID.forEach((g, i) => {
    const id = `lt${i}`
    s[id] = {
      x: g.xPct*(vw-LETTER_SIZE), y: g.yPct*(vh-LETTER_SIZE), rot: g.rot,
      vx: g.baseVx, vy: g.baseVy, vrot: g.baseVrot,
      baseVx: g.baseVx, baseVy: g.baseVy, baseVrot: g.baseVrot,
    }
  })
  return s
}

export default function HomePage() {
  // About panel — same FLIP pick-up/put-down system as photo viewer
  const [aboutOpen,    setAboutOpen]    = useState(false)   // mounted
  const [aboutVisible, setAboutVisible] = useState(false)   // animation state
  const [logoSource,   setLogoSource]   = useState({ x: 0, y: 0, scale: 1, rot: 0 })
  const [activePhoto,  setActivePhoto]  = useState<Project | null>(null)
  const [lbZoom,       setLbZoom]       = useState(1)
  const [lbVisible,    setLbVisible]    = useState(false)
  // Letters/logo only sling away on zoom-in, not on viewer open — they float in background
  const [floatsHidden,  setFloatsHidden]  = useState(false)
  // FLIP source — where the photo starts (canvas position) and ends (canvas position on close)
  const [lbSource,      setLbSource]      = useState({ x: 0, y: 0, scale: 0.15, rot: 0 })
  // Controls the canvas zoom-out independently of activePhoto so we can start
  // the scale-back at the same moment the viewer exit animation begins
  const [canvasScaled,  setCanvasScaled]  = useState(false)

  // Gallery navigation within a job
  const [galleryIndex, setGalleryIndex] = useState(0)
  // Two-layer slide: the outgoing index sticks around for the duration of the animation
  const [galleryPrev,  setGalleryPrev]  = useState<number | null>(null)
  // Direction of the last navigation — drives which way the slide animates (1 = forward, -1 = back)
  const [galleryDir,   setGalleryDir]   = useState<1 | -1>(1)
  // Animation phase — 'start' = layers at initial offsets (no transition), 'end' = transitioned to final positions
  const [galleryPhase, setGalleryPhase] = useState<'idle' | 'start' | 'end'>('idle')
  const galleryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Tile image per project — defaults to proj.src, updates to whatever was last viewed in the lightbox
  const [tileSrc, setTileSrc] = useState<Record<string, string | null>>(
    () => Object.fromEntries(PROJECTS.map(p => [p.id, p.src]))
  )
  // Refs so the open/close effects can read latest values without taking them as deps
  // (deps churn here would re-fire the visibility effect mid-close and break the FLIP transition)
  const tileSrcRef = useRef(tileSrc)
  useEffect(() => { tileSrcRef.current = tileSrc }, [tileSrc])
  const galleryIndexRef = useRef(0)
  useEffect(() => { galleryIndexRef.current = galleryIndex }, [galleryIndex])

  const lbIsClosingRef = useRef(false)
  // Freeze physics positions during return animations so canvas elements meet the viewer exactly
  const frozenPhotoRef = useRef<{ id: string; x: number; y: number; rot: number } | null>(null)
  const frozenLogoRef  = useRef<{ x: number; y: number; rot: number } | null>(null)

  const elRefs     = useRef<Record<string, HTMLElement | null>>({})
  const posRef     = useRef<Record<string, PhysicsState>>({})
  const rafRef     = useRef<number | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  const dragRef    = useRef<DragState | null>(null)
  const didDragRef = useRef(false)

  // Pan: entirely direct DOM — no React state during drag, zero latency
  const lbZoomLayerRef  = useRef<HTMLDivElement | null>(null)
  const lbPanRef        = useRef({ x: 0, y: 0 })
  const lbPanBaseRef    = useRef({ x: 0, y: 0 })
  const lbPanStartRef   = useRef({ x: 0, y: 0 })
  const lbPanningRef    = useRef(false)
  const lbDidPanRef     = useRef(false)
  const lbZoomRef       = useRef(1)

  // Smooth ease — no bounce/overshoot on zoom
  const ZOOM_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

  const applyLbTransform = useCallback((z: number, px: number, py: number, animated: boolean) => {
    const el = lbZoomLayerRef.current; if (!el) return
    el.style.transition = animated ? `transform 0.42s ${ZOOM_EASE}` : 'none'
    el.style.transform  = `scale(${z}) translate(${px / z}px, ${py / z}px)`
  }, [ZOOM_EASE])

  // When photo changes: reset zoom/pan/gallery. Letters keep floating — only sling on zoom.
  useEffect(() => {
    setLbZoom(1)
    lbZoomRef.current = 1
    lbPanRef.current  = { x: 0, y: 0 }
    lbPanBaseRef.current = { x: 0, y: 0 }
    applyLbTransform(1, 0, 0, false)
    lbIsClosingRef.current = false
    // Seed gallery index from the tile's current image so the lightbox opens on whatever the user last saw.
    // Read tileSrc via ref — we only want this effect firing on activePhoto changes, not tileSrc updates.
    if (activePhoto) {
      const current = tileSrcRef.current[activePhoto.id] ?? activePhoto.src
      const idx = current ? activePhoto.gallery.indexOf(current) : 0
      setGalleryIndex(idx >= 0 ? idx : 0)
    } else {
      setGalleryIndex(0)
    }
    // Reset crossfade state — no outgoing image when (re)opening or closing
    if (galleryTimerRef.current) { clearTimeout(galleryTimerRef.current); galleryTimerRef.current = null }
    setGalleryPrev(null)
    if (!activePhoto) setFloatsHidden(false)
    if (activePhoto) requestAnimationFrame(() => setLbVisible(true))
  }, [activePhoto, applyLbTransform])

  // Navigate within the job's gallery — directional two-layer slide.
  // Outgoing image slides off opposite to direction, incoming slides in from direction.
  // Implementation: paint the layers at their START offsets (no transition), then on the
  // next frame flip to END (with transition enabled). Pure state — no CSS keyframes needed.
  const navigate = useCallback((dir: 1 | -1) => {
    const photo = activePhoto
    if (!photo || photo.gallery.length <= 1) return
    if (galleryTimerRef.current) clearTimeout(galleryTimerRef.current)
    const oldIdx = galleryIndexRef.current
    setGalleryDir(dir)
    setGalleryPrev(oldIdx)
    setGalleryIndex((oldIdx + dir + photo.gallery.length) % photo.gallery.length)
    setGalleryPhase('start')
    // Two rAFs — first one ensures the browser paints the 'start' frame, the second flips to 'end'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setGalleryPhase('end'))
    })
    galleryTimerRef.current = setTimeout(() => {
      setGalleryPrev(null)
      setGalleryPhase('idle')
    }, 540)
  }, [activePhoto])

  // Preload neighbours so the crossfade has nothing to wait for
  useEffect(() => {
    if (!activePhoto || activePhoto.gallery.length <= 1) return
    const len = activePhoto.gallery.length
    const neighbours = [
      activePhoto.gallery[(galleryIndex + 1) % len],
      activePhoto.gallery[(galleryIndex - 1 + len) % len],
    ]
    neighbours.forEach(url => {
      if (!url) return
      const img = new window.Image()
      img.src = url
    })
  }, [activePhoto, galleryIndex])

  // ── About open / close — same FLIP pattern as photo viewer ──────────────
  const openAbout = useCallback(() => {
    const el = elRefs.current['logo']
    if (el) {
      const rect = el.getBoundingClientRect()
      const vw = window.innerWidth; const vh = window.innerHeight
      const viewerSize = Math.min(280, vw * 0.6)
      setLogoSource({
        x: (rect.left + rect.width  / 2) - vw / 2,
        y: (rect.top  + rect.height / 2) - vh / 2,
        scale: rect.width / viewerSize,
        rot: posRef.current['logo']?.rot ?? 0,
      })
    }
    setAboutOpen(true)
  }, [])

  const closeAbout = useCallback(() => {
    const pos = posRef.current['logo']
    if (pos) {
      const vw = window.innerWidth; const vh = window.innerHeight
      const viewerSize = Math.min(280, vw * 0.6)
      frozenLogoRef.current = { x: pos.x, y: pos.y, rot: pos.rot }
      setLogoSource({
        x: pos.x + LOGO_SIZE / 2 - vw / 2,
        y: pos.y + LOGO_SIZE / 2 - vh / 2,
        scale: LOGO_SIZE / viewerSize,
        rot: pos.rot,
      })
    }
    setAboutVisible(false)
    setTimeout(() => {
      setAboutOpen(false)
      frozenLogoRef.current = null
    }, 340)
  }, [])

  // Mount/unmount lifecycle for about panel (mirrors activePhoto useEffect)
  useEffect(() => {
    if (aboutOpen) requestAnimationFrame(() => setAboutVisible(true))
    else setAboutVisible(false)
  }, [aboutOpen])

  const openLightbox = useCallback((proj: Project) => {
    // FLIP source — capture canvas tile rect at scale(1) (viewer not yet open)
    const el = elRefs.current[proj.id]
    if (el) {
      const rect = el.getBoundingClientRect()
      const vw   = window.innerWidth; const vh = window.innerHeight
      const cfg  = PHOTO_CFG[proj.id]
      if (cfg) {
        // Use the currently displayed tile image's aspect — matches whichever shape lightbox is about to open as
        const currentSrc = tileSrcRef.current[proj.id] ?? proj.src
        const aspect = getSrcAspect(currentSrc, cfg.aspect)
        const [aw, ah] = aspect.split('/').map(Number)
        const viewerW  = Math.min(vw - 48, vh * 0.8 * (aw / ah))
        setLbSource({
          x: (rect.left + rect.width  / 2) - vw / 2,
          y: (rect.top  + rect.height / 2) - vh / 2,
          scale: Math.max(0.08, rect.width / viewerW),
          rot: posRef.current[proj.id]?.rot ?? cfg.rot,  // current tilt — straightens as it rises
        })
      }
    }
    setCanvasScaled(true)   // canvas starts zooming out
    setActivePhoto(proj)
  }, [])

  const closeLightbox = useCallback(() => {
    // Remember the image the user last saw so the canvas tile reflects it.
    // Also re-centre the tile's position so reshaping (portrait→landscape or back) doesn't make it jump.
    if (activePhoto) {
      const lastSrc = activePhoto.gallery[galleryIndexRef.current] ?? activePhoto.src
      const cfg = PHOTO_CFG[activePhoto.id]
      const pos = posRef.current[activePhoto.id]
      if (lastSrc && cfg && pos) {
        const oldSrc = tileSrcRef.current[activePhoto.id] ?? activePhoto.src
        const oldDims = getTileDims(activePhoto.id, oldSrc)
        const newDims = getTileDims(activePhoto.id, lastSrc)
        // Keep the tile's centre stable as it changes shape
        pos.x += (oldDims.w - newDims.w) / 2
        pos.y += (oldDims.h - newDims.h) / 2
      }
      if (lastSrc) setTileSrc(prev => ({ ...prev, [activePhoto.id]: lastSrc }))
    }
    // FLIP target — use the raw physics position (scale(1) equivalent),
    // because we're zooming the canvas back to scale(1) at the same moment.
    // The viewer photo and the canvas tile arrive at the same spot simultaneously.
    if (activePhoto) {
      const pos = posRef.current[activePhoto.id]
      const cfg = PHOTO_CFG[activePhoto.id]
      if (pos && cfg) {
        const vw = window.innerWidth; const vh = window.innerHeight
        // Use the gallery image the user just had open — both the tile (now resized to match) and the lightbox use this aspect
        const lastSrc2 = activePhoto.gallery[galleryIndexRef.current] ?? activePhoto.src
        const aspect = getSrcAspect(lastSrc2, cfg.aspect)
        const [aw, ah] = aspect.split('/').map(Number)
        const { w, h } = getTileDims(activePhoto.id, lastSrc2)
        const viewerW  = Math.min(vw - 48, vh * 0.8 * (aw / ah))
        // Freeze the tile at this exact position so it can't drift while the
        // viewer photo is in flight — they'll land at exactly the same spot
        frozenPhotoRef.current = { id: activePhoto.id, x: pos.x, y: pos.y, rot: pos.rot }
        setLbSource({
          x: pos.x + w / 2 - vw / 2,
          y: pos.y + h / 2 - vh / 2,
          scale: Math.max(0.08, w / viewerW),
          rot: pos.rot,  // photo tilts back to its canvas angle as it lands
        })
      }
    }
    setCanvasScaled(false)           // canvas starts zooming back immediately
    lbIsClosingRef.current = true
    setLbVisible(false)
    setTimeout(() => {
      setActivePhoto(null)
      lbIsClosingRef.current = false
      frozenPhotoRef.current = null  // unfreeze — physics resumes
    }, 340)
  }, [activePhoto])

  // Keyboard: arrow keys to navigate gallery, Escape to close viewer or about panel
  // Placed after navigate + closeLightbox + closeAbout so all are in scope
  useEffect(() => {
    if (!activePhoto && !aboutOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (aboutOpen) { if (e.key === 'Escape') closeAbout(); return }
      if (e.key === 'ArrowRight') navigate(1)
      if (e.key === 'ArrowLeft')  navigate(-1)
      if (e.key === 'Escape')     closeLightbox()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activePhoto, aboutOpen, navigate, closeLightbox, closeAbout])

  // EFFECT 1 — write initial transforms synchronously before first paint
  useClientLayoutEffect(() => {
    const vw = window.innerWidth; const vh = window.innerHeight
    posRef.current = buildInitialState(vw, vh)
    for (const [id, pos] of Object.entries(posRef.current)) {
      const el = elRefs.current[id]
      if (el) el.style.transform = `translate3d(${pos.x}px,${pos.y}px,0) rotate(${pos.rot}deg)`
    }
  }, [])

  // EFFECT 2 — physics loop
  useEffect(() => {
    let prev = performance.now()
    function tick(now: number) {
      const dt = Math.min(now - prev, 100) / 1000
      prev = now
      const vw = window.innerWidth; const vh = window.innerHeight
      for (const id of Object.keys(posRef.current)) {
        const pos = posRef.current[id]
        if (!pos || dragRef.current?.id === id) continue
        // Freeze physics during return animations so canvas elements meet the viewer exactly
        if (frozenPhotoRef.current?.id === id) {
          const f = frozenPhotoRef.current
          const el = elRefs.current[id]
          if (el) el.style.transform = `translate3d(${f.x}px,${f.y}px,0) rotate(${f.rot}deg)`
          continue
        }
        if (id === 'logo' && frozenLogoRef.current) {
          const f = frozenLogoRef.current
          const el = elRefs.current['logo']
          if (el) el.style.transform = `translate3d(${f.x}px,${f.y}px,0) rotate(${f.rot}deg)`
          continue
        }
        pos.vx   = pos.baseVx   + (pos.vx   - pos.baseVx)   * 0.985
        pos.vy   = pos.baseVy   + (pos.vy   - pos.baseVy)   * 0.985
        pos.vrot = pos.baseVrot + (pos.vrot - pos.baseVrot) * 0.985
        pos.x += pos.vx * dt; pos.y += pos.vy * dt; pos.rot += pos.vrot * dt
        if (id !== 'logo' && !id.startsWith('lt')) {
          if (pos.rot >  35) { pos.rot =  35; pos.vrot = Math.min(pos.vrot, 0); pos.baseVrot = -Math.abs(pos.baseVrot) }
          if (pos.rot < -35) { pos.rot = -35; pos.vrot = Math.max(pos.vrot, 0); pos.baseVrot =  Math.abs(pos.baseVrot) }
        }
        const { w, h } = getDims(id)
        if (pos.x >  vw + 60) pos.x = -w
        if (pos.x < -w)       pos.x =  vw + 60
        if (pos.y >  vh + 60) pos.y = -h
        if (pos.y < -h)       pos.y =  vh + 60
        const el = elRefs.current[id]
        if (el) el.style.transform = `translate3d(${pos.x}px,${pos.y}px,0) rotate(${pos.rot}deg)`
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    function startLoop() {
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      posRef.current = buildInitialState(window.innerWidth, window.innerHeight)
      for (const [id, pos] of Object.entries(posRef.current)) {
        const el = elRefs.current[id]
        if (el) el.style.transform = `translate3d(${pos.x}px,${pos.y}px,0) rotate(${pos.rot}deg)`
      }
      prev = performance.now(); rafRef.current = requestAnimationFrame(tick)
    }
    prev = performance.now(); rafRef.current = requestAnimationFrame(tick)
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) startLoop() }
    const onVisible  = () => {
      if (!document.hidden && rafRef.current === null) {
        prev = performance.now(); rafRef.current = requestAnimationFrame(tick)
      }
    }
    window.addEventListener('pageshow', onPageShow)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    const pos = posRef.current[id]; if (!pos) return
    didDragRef.current = false
    const sRect = sectionRef.current?.getBoundingClientRect()
    dragRef.current = {
      id,
      ox: e.clientX - (sRect?.left ?? 0) - pos.x,
      oy: e.clientY - (sRect?.top  ?? 0) - pos.y,
      startX: e.clientX, startY: e.clientY,
      px: e.clientX, py: e.clientY, nx: e.clientX, ny: e.clientY,
    }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current; if (!d) return
    const pos = posRef.current[d.id]; if (!pos) return
    d.px = d.nx; d.py = d.ny; d.nx = e.clientX; d.ny = e.clientY
    if (Math.hypot(d.nx - d.startX, d.ny - d.startY) > DRAG_THRESHOLD) didDragRef.current = true
    const sRect = sectionRef.current?.getBoundingClientRect()
    pos.x = e.clientX - (sRect?.left ?? 0) - d.ox
    pos.y = e.clientY - (sRect?.top  ?? 0) - d.oy
    const el = elRefs.current[d.id]
    if (el) el.style.transform = `translate3d(${pos.x}px,${pos.y}px,0) rotate(${pos.rot}deg)`
  }, [])

  const onPointerUp = useCallback((_e: React.PointerEvent) => {
    const d = dragRef.current; if (!d) return
    const pos = posRef.current[d.id]
    if (pos) {
      const dvx = (d.nx - d.px) * 60; const dvy = (d.ny - d.py) * 60
      pos.vx = dvx; pos.vy = dvy
      const { w: dw, h: dh } = getDims(d.id)
      const cx = pos.x + dw * 0.5; const cy = pos.y + dh * 0.5
      const dragR = getRadius(d.id)
      for (const otherId of Object.keys(posRef.current)) {
        if (otherId === d.id) continue
        const other = posRef.current[otherId]; if (!other) continue
        const { w: ow, h: oh } = getDims(otherId)
        const ocx = other.x + ow * 0.5; const ocy = other.y + oh * 0.5
        const dist = Math.hypot(ocx - cx, ocy - cy)
        if (dist < dragR + getRadius(otherId) + 40 && dist > 0.5) {
          const ux = (ocx - cx) / dist; const uy = (ocy - cy) / dist
          other.vx += ux * Math.hypot(dvx, dvy) * 0.6
          other.vy += uy * Math.hypot(dvx, dvy) * 0.6
        }
      }
    }
    dragRef.current = null
  }, [])

  // Lightbox pan — direct DOM, no React state, 1:1 with pointer
  const onLbImageDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation(); lbDidPanRef.current = false
    if (lbZoomRef.current <= 1) return
    lbPanningRef.current  = true
    lbPanStartRef.current = { x: e.clientX, y: e.clientY }
    lbPanBaseRef.current  = { ...lbPanRef.current }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onLbImageMove = useCallback((e: React.PointerEvent) => {
    if (!lbPanningRef.current) return
    const dx = e.clientX - lbPanStartRef.current.x
    const dy = e.clientY - lbPanStartRef.current.y
    if (Math.hypot(dx, dy) > 4) lbDidPanRef.current = true
    const p = { x: lbPanBaseRef.current.x + dx, y: lbPanBaseRef.current.y + dy }
    lbPanRef.current = p
    applyLbTransform(lbZoomRef.current, p.x, p.y, false)  // direct DOM, no render
  }, [applyLbTransform])

  const onLbImageUp = useCallback((_e: React.PointerEvent) => {
    lbPanningRef.current = false
    // Restore spring transition so next zoom click feels bouncy
    const el = lbZoomLayerRef.current
    if (el) el.style.transition = `transform 0.42s ${ZOOM_EASE}`
  }, [ZOOM_EASE])

  const onLbImageClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); if (lbDidPanRef.current) return
    if (lbZoomRef.current === 1) {
      lbZoomRef.current = 2.5; setLbZoom(2.5)
      lbPanRef.current = { x: 0, y: 0 }
      applyLbTransform(2.5, 0, 0, true)
    } else {
      lbZoomRef.current = 1; setLbZoom(1)
      lbPanRef.current = { x: 0, y: 0 }
      applyLbTransform(1, 0, 0, true)
    }
  }, [applyLbTransform])

  const lbCfg    = activePhoto ? PHOTO_CFG[activePhoto.id] : null
  // Lightbox shape follows the current gallery image, not a fixed project aspect
  const lbCurrentSrc = activePhoto?.gallery[galleryIndex] ?? null
  const lbAspect = getSrcAspect(lbCurrentSrc, lbCfg?.aspect ?? '16/9')
  const [lbAW, lbAH] = lbAspect.split('/').map(Number)
  const lbRatio  = lbAW / lbAH

  return (
    <main>
      <a href="#canvas"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded">
        Skip to content
      </a>

      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-end px-6 md:px-10 h-16 pointer-events-none">
        <nav className="flex gap-6 pointer-events-auto" aria-label="Primary navigation">
          {([
            { href: '/live',    label: 'Work'    },
            { href: '/about',   label: 'About'   },
            { href: '/contact', label: 'Contact' },
          ] as { href: string; label: string }[]).map(({ href, label }) => (
            <a key={href} href={href}
              className="text-sm tracking-widest uppercase text-fg-muted hover:text-fg-default transition-colors duration-200 focus:outline-none focus:text-accent">
              {label}
            </a>
          ))}
        </nav>
      </header>

      {/* ─── Canvas ─────────────────────────────────────────────────────── */}
      <section
        id="canvas"
        ref={(el) => { sectionRef.current = el }}
        className="relative h-screen bg-bg-default overflow-hidden isolate"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        aria-label="Work scrapbook"
      >
        {/* ── Photo cards ─────────────────────────────────────────────────
            Wrapped in a scale container that zooms out when the viewer opens.
            This gives the "pulled back to a higher view" feel — all photos
            appear smaller and floating in the background behind the overlay. */}
        <div style={{
          position: 'absolute', inset: 0,
          transform: canvasScaled ? 'scale(0.62)' : 'scale(1)',
          transformOrigin: 'center center',
          transition: 'transform 0.40s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {PROJECTS.map(proj => {
            const cfg = PHOTO_CFG[proj.id]; if (!cfg) return null
            // Both width AND height follow the current image's orientation, keeping the long dim
            // constant so landscape tiles aren't smaller than portrait ones from the same project.
            const currentSrc = tileSrc[proj.id] ?? proj.src
            const { w: tileW, h: tileH } = getTileDims(proj.id, currentSrc)
            const isPickedUp = activePhoto?.id === proj.id
            return (
              <div
                key={proj.id}
                ref={el => { elRefs.current[proj.id] = el as HTMLElement | null }}
                className="absolute top-0 left-0 touch-none"
                style={{
                  width: tileW, height: tileH,
                  willChange: 'transform', borderRadius: 2, overflow: 'hidden',
                  cursor: 'grab', zIndex: 1,
                  // Snap invisible the moment it's picked up; snap back the instant photo lands
                  opacity: isPickedUp && canvasScaled ? 0 : 1,
                  transition: isPickedUp
                    ? (canvasScaled
                        ? 'opacity 0s'              // instant hide — photo lifts off from this spot
                        : 'opacity 0s ease 0.22s')  // snap in as viewer photo arrives (no fade)
                    : 'none',
                }}
                onPointerDown={e => { if (!activePhoto) onPointerDown(e, proj.id) }}
                onContextMenu={e => e.preventDefault()}
                onClick={() => { if (!didDragRef.current && !activePhoto) openLightbox(proj) }}
                role="button" tabIndex={0} aria-label={`${proj.title} — ${proj.category}`}
                onKeyDown={e => { if (e.key === 'Enter' && !activePhoto) openLightbox(proj) }}
              >
                {(tileSrc[proj.id] ?? proj.src)
                  ? <Image src={(tileSrc[proj.id] ?? proj.src) as string} fill alt={`${proj.title} by Nadim Kurimbokus`}
                      className="object-cover" draggable={false} sizes={`${cfg.w}px`} unoptimized />
                  : <div className="w-full h-full" style={{ backgroundColor: proj.color }} />}
                <div className="absolute inset-0" style={{ zIndex: 1 }} />
              </div>
            )
          })}
        </div>

        {/* ── Logo ────────────────────────────────────────────────────────
            Sits OUTSIDE the scale wrapper so it's unaffected by the zoom-out.
            When the viewer opens (floatsHidden=true) its inner div drifts off-frame.
            The logo PNG is ~2.8:1, so in this square box only the middle band is visible.
            Events live on a centred hit pad that matches the visible bounds — clicks in
            the empty corners pass through. */}
        <div
          ref={el => { elRefs.current['logo'] = el }}
          className="absolute top-0 left-0 touch-none"
          style={{ width: LOGO_SIZE, height: LOGO_SIZE, willChange: 'transform', zIndex: 5, pointerEvents: 'none' }}
        >
          <div style={{
            width: '100%', height: '100%',
            // Snap invisible when picked up, snap back when placed down
            opacity: floatsHidden ? 0 : (aboutOpen && aboutVisible ? 0 : 1),
            transform: floatsHidden ? FLOAT_DRIFT.logo : 'translate(0px,0px) scale(1)',
            transition: (aboutOpen && aboutVisible)
              ? 'opacity 0s'
              : (aboutOpen && !aboutVisible)
                ? 'opacity 0s ease 0.22s'
                : floatsHidden
                  ? 'opacity 0.20s ease, transform 0.28s cubic-bezier(0.55,0,1,0.45)'
                  : 'opacity 0.55s ease 0.08s, transform 0.62s cubic-bezier(0.16,1,0.3,1) 0.08s',
          }}>
            <Image src="/logo.png" fill alt="Nadim Kurimbokus" style={{ objectFit: 'contain' }} draggable={false} unoptimized />
          </div>
          {/* Hit pad — sits over just the visible logo strip (~36% of the square's height) */}
          <div
            className="absolute left-0 touch-none"
            style={{
              top: '50%',
              width: '100%',
              height: '40%',
              transform: 'translateY(-50%)',
              cursor: 'grab',
              pointerEvents: 'auto',
            }}
            onPointerDown={e => onPointerDown(e, 'logo')}
            onClick={() => { if (!didDragRef.current) openAbout() }}
            onContextMenu={e => e.preventDefault()}
            role="button" tabIndex={0} aria-label="About Nadim Kurimbokus"
            onKeyDown={e => { if (e.key === 'Enter') openAbout() }}
          />
        </div>

        {/* ── Letters ─────────────────────────────────────────────────────
            Each one drifts in a unique direction — upper-left, upper-right, down.
            Staggered so they leave in a cascade, not all at once. */}
        {LETTER_CHARS.map((char, i) => {
          const driftKey = `lt${i}` as keyof typeof FLOAT_DRIFT
          const outDelay = i * 0.045
          const inDelay  = 0.10 + i * 0.08
          return (
            <div
              key={`lt${i}`}
              ref={el => { elRefs.current[`lt${i}`] = el }}
              className="absolute top-0 left-0 touch-none select-none"
              style={{ width: LETTER_SIZE, height: LETTER_SIZE, willChange: 'transform', cursor: 'grab', zIndex: 5 }}
              onPointerDown={e => onPointerDown(e, `lt${i}`)}
            >
              <div style={{
                width: '100%', height: '100%',
                opacity: floatsHidden ? 0 : 1,
                transform: floatsHidden ? (FLOAT_DRIFT[driftKey] ?? FLOAT_DRIFT.lt0) : 'translate(0px,0px) scale(1)',
                transition: floatsHidden
                  ? `opacity ${0.16 + i * 0.04}s ease ${outDelay}s, transform ${0.22 + i * 0.04}s cubic-bezier(0.55,0,1,0.45) ${outDelay}s`
                  : `opacity 0.50s ease ${inDelay}s, transform 0.56s cubic-bezier(0.16,1,0.3,1) ${inDelay}s`,
              }}>
                <Image src={`/letters/${char}.png`} width={LETTER_SIZE} height={LETTER_SIZE} alt={char} draggable={false} unoptimized />
              </div>
            </div>
          )
        })}
      </section>

      {/* ─── About panel — logo FLIP pick-up/put-down ──────────────────── */}
      {aboutOpen && (
        <>
          {/* Click-to-close backdrop */}
          <div
            className="fixed inset-0 z-[8]"
            style={{ cursor: 'zoom-out' }}
            onClick={closeAbout}
          />

          <div
            className="fixed inset-0 z-[9] flex flex-col items-center justify-center p-8 gap-8 pointer-events-none"
            role="dialog" aria-modal="true" aria-label="About Nadim Kurimbokus"
          >
            {/* Logo — FLIP from canvas position, same mechanics as photo viewer */}
            <div
              className="relative pointer-events-auto"
              style={{
                width: 'min(280px, 60vw)',
                height: 'min(280px, 60vw)',
                opacity: aboutVisible ? 1 : 0,
                transform: aboutVisible
                  ? 'translate(0px,0px) scale(1) rotate(0deg)'
                  : `translate(${logoSource.x}px,${logoSource.y}px) scale(${logoSource.scale}) rotate(${logoSource.rot}deg)`,
                transition: aboutVisible
                  ? 'transform 0.36s cubic-bezier(0.16,1,0.3,1), opacity 0s'
                  : 'transform 0.26s cubic-bezier(0.55,0,1,0.45), opacity 0s ease 0.22s',
              }}
              onClick={e => e.stopPropagation()}
            >
              <Image src="/logo.png" fill alt="Nadim Kurimbokus" style={{ objectFit: 'contain' }} unoptimized />
            </div>

            {/* About text — paper card so the copy is readable over the busy canvas */}
            <div
              className="text-center pointer-events-auto bg-bg-default px-8 py-7 rounded-sm shadow-xl max-w-md"
              style={{
                opacity: aboutVisible ? 1 : 0,
                transition: aboutVisible ? 'opacity 0.20s ease 0.28s' : 'opacity 0.08s ease',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h1 className="text-fg-default text-2xl mb-3 font-display">Nadim Kurimbokus</h1>
              <p className="text-fg-muted leading-relaxed mb-6">
                British-Mauritian photographer based in London. Shooting music, performance,
                and the spaces in between — from headline stages to rehearsal rooms.
              </p>
              <button
                className="text-fg-muted text-xs tracking-widest uppercase hover:text-fg-default transition-colors focus:outline-none focus:text-accent"
                onClick={closeAbout}
              >Close</button>
            </div>
          </div>
        </>
      )}

      {/* ─── Photo viewer ───────────────────────────────────────────────── */}
      {activePhoto && (
        <>
          {/* Click-to-close backdrop */}
          <div
            className="fixed inset-0 z-[8]"
            style={{ cursor: 'zoom-out' }}
            onClick={closeLightbox}
          />

          {/* No overlay — the photo just floats above the live canvas.
              Shadow on the photo card gives the sense of elevation. */}
          <div
            className="fixed inset-0 z-[9] flex flex-col items-center justify-center p-6 gap-4 pointer-events-none"
            style={{ backgroundColor: 'transparent' }}
            role="dialog" aria-modal="true"
            aria-label={`${activePhoto.title} — ${activePhoto.category}`}
          >
            {/* Selected photo — rises from below on open, drifts upward on close */}
            <div
              className="relative pointer-events-auto"
              style={{
                aspectRatio: lbAspect,
                width: `min(calc(100vw - 48px), calc(80vh * ${lbRatio.toFixed(6)}))`,
                maxHeight: '80vh',
                opacity: lbVisible ? 1 : 0,
                // FLIP — photo snaps from the canvas tile into the viewer and back.
                // Rotation: straightens as it lifts, tilts back as it lands.
                // No opacity dissolves — snaps on pickup, snaps off on landing.
                transform: lbVisible
                  ? 'translate(0px, 0px) scale(1) rotate(0deg)'
                  : `translate(${lbSource.x}px, ${lbSource.y}px) scale(${lbSource.scale}) rotate(${lbSource.rot}deg)`,
                transition: lbVisible
                  // Pickup: quick spring to viewer — snaps visible instantly, no fade-in.
                  // aspect-ratio + width also transition so navigating between portrait/landscape gallery images is smooth.
                  ? 'transform 0.36s cubic-bezier(0.16, 1, 0.3, 1), opacity 0s, aspect-ratio 0.34s cubic-bezier(0.16, 1, 0.3, 1), width 0.34s cubic-bezier(0.16, 1, 0.3, 1)'
                  // Putdown: dashes back home — opacity snaps off just as it arrives
                  : 'transform 0.26s cubic-bezier(0.55, 0, 1, 0.45), opacity 0s ease 0.22s',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Zoom / pan layer — transform managed entirely via direct DOM */}
              <div
                ref={(el) => { lbZoomLayerRef.current = el }}
                style={{
                  position: 'absolute', inset: 0,
                  cursor: lbZoom > 1 ? 'grab' : 'zoom-in',
                }}
                onPointerDown={onLbImageDown}
                onPointerMove={onLbImageMove}
                onPointerUp={onLbImageUp}
                onClick={onLbImageClick}
                onContextMenu={e => e.preventDefault()}
              >
                {/* Gallery — directional two-layer slide via state-driven CSS transitions.
                    No overflow:hidden — we want the images to be visible as they travel across the
                    screen between the viewport edge and the lightbox centre. */}
                <div className="relative w-full h-full">
                  {(() => {
                    const isAnimating = galleryPrev !== null
                    const dirSign = galleryDir > 0 ? 1 : -1
                    // The offset that puts an image entirely off the viewport edge in `dir`'s direction.
                    // 50% (of the image's own width) takes its near edge to the lightbox edge;
                    // an additional 50vw carries it the rest of the way to the viewport edge — exact regardless of image aspect.
                    const offScreen = (sign: number) => `translateX(calc(${sign * 50}% + ${sign * 50}vw))`
                    const onScreen  = 'translateX(0)'
                    // Curr layer: starts off-screen in dir, ends on-screen (transition kicks in at 'end')
                    const currTransform = isAnimating && galleryPhase === 'start' ? offScreen(dirSign) : onScreen
                    // Prev layer: starts on-screen, ends off-screen in the opposite direction
                    const prevTransform = galleryPhase === 'end' ? offScreen(-dirSign) : onScreen
                    const trans = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)'
                    return (
                      <>
                        {isAnimating && activePhoto.gallery[galleryPrev!] && (
                          <div
                            // Key includes galleryPrev so rapid clicks remount with a clean start state
                            key={`prev-${galleryPrev}`}
                            className="absolute inset-0"
                            style={{
                              transform: prevTransform,
                              transition: galleryPhase === 'idle' ? 'none' : trans,
                              willChange: 'transform',
                            }}
                          >
                            <Image
                              src={activePhoto.gallery[galleryPrev!]}
                              fill alt=""
                              className="object-contain" draggable={false}
                              sizes="(max-width: 768px) 100vw, 1600px"
                              unoptimized
                            />
                          </div>
                        )}
                        <div
                          // Key includes galleryIndex so rapid clicks remount fresh at the start offset
                          key={`curr-${galleryIndex}`}
                          className="absolute inset-0"
                          style={{
                            transform: currTransform,
                            // No transition during 'start' frame so the curr layer pops into its offset position;
                            // transition kicks in when we flip to 'end'
                            transition: !isAnimating || galleryPhase === 'start' ? 'none' : trans,
                            willChange: 'transform',
                          }}
                        >
                          {activePhoto.gallery[galleryIndex]
                            ? <Image
                                src={activePhoto.gallery[galleryIndex]}
                                fill alt={activePhoto.title}
                                className="object-contain" draggable={false}
                                sizes="(max-width: 768px) 100vw, 1600px"
                                priority unoptimized
                              />
                            : <div className="w-full h-full" style={{ backgroundColor: activePhoto.color }} />}
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Gallery nav arrows — only shown when job has multiple images */}
              {activePhoto.gallery.length > 1 && (
                <>
                  <button
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-4 pl-1 py-6 text-fg-muted hover:text-fg-default transition-colors focus:outline-none focus:text-accent"
                    onClick={e => { e.stopPropagation(); navigate(-1) }}
                    aria-label="Previous image"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="13 4 7 10 13 16" />
                    </svg>
                  </button>
                  <button
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-4 pr-1 py-6 text-fg-muted hover:text-fg-default transition-colors focus:outline-none focus:text-accent"
                    onClick={e => { e.stopPropagation(); navigate(1) }}
                    aria-label="Next image"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="7 4 13 10 7 16" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Caption */}
            <div
              className="relative flex items-center justify-between w-full max-w-2xl pointer-events-auto"
              style={{
                zIndex: 1,
                opacity: lbVisible ? 1 : 0,
                transition: lbVisible
                  ? 'opacity 0.20s ease 0.28s'
                  : 'opacity 0.08s ease',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div>
                <p className="text-fg-default text-sm font-medium">{activePhoto.title}</p>
                <p className="text-fg-default text-xs mt-0.5 opacity-50">{activePhoto.category} &bull; {activePhoto.year}</p>
              </div>
              <div className="flex items-center gap-4">
                {activePhoto.gallery.length > 1 && (
                  <span className="text-fg-default text-xs opacity-30 tabular-nums">
                    {galleryIndex + 1} / {activePhoto.gallery.length}
                  </span>
                )}
                <span className="text-fg-default text-xs opacity-40">{lbZoom === 1 ? 'tap to zoom' : 'tap to fit'}</span>
                <button
                  className="text-fg-default text-xs tracking-widest uppercase opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus:text-accent"
                  onClick={closeLightbox}
                >Close</button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
