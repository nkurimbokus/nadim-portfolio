'use client'

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react'
import Image from 'next/image'

/**
 * BLEND MODE SURFACES (mix-blend-mode: difference)
 *
 * Every surface that inverts text against a dynamic background uses this pattern:
 * 1. Container div: fixed inset-0, z-[N], style={{ mixBlendMode: 'difference', color: '#ffffff', opacity: 1, pointerEvents: 'none' }}
 * 2. Inner wrapper: absolute inset-x-0, style={{ pointerEvents: 'auto' }} (re-enables clicks)
 * 3. Text elements: no inline colour, no opacity utilities, inherit #ffffff from parent
 * 4. Show/hide: conditional mount/unmount ({aboutVisible && ...}), not opacity animations
 *
 * Applied to: <header>, work overlay (z-[60]), about text layer (z-[61]), lightbox caption (z-[10])
 *
 * Global CSS rule (app/globals.css:156–159): all p/a/span/button get mix-blend-mode: difference + color: #ffffff
 * Exception: <main> inherits color: var(--color-text-inverted) which is black, so blending surfaces must override with color: '#ffffff'
 *
 * NO opacity utilities on text — they create stacking contexts that trap blend modes
 */

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

const LOGO_SIZE        = 180
const LOGO_SIZE_MOBILE = 120
const LOGO_VISUAL_SIZE        = 360
const LOGO_VISUAL_SIZE_MOBILE = 240
const DRAG_THRESHOLD   = 8
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
  // New live 2025 shoots
  l4: { w: 240, aspect: '1078/1600', rot:  2.0, xPct: 0.18, yPct: 0.08, baseVx:  -9, baseVy:   7, baseVrot: -0.22 },
  l5: { w: 240, aspect: '1076/1600', rot: -1.5, xPct: 0.58, yPct: 0.15, baseVx:  10, baseVy:  -8, baseVrot:  0.26 },
  l6: { w: 240, aspect: '1077/1600', rot:  2.5, xPct: 0.72, yPct: 0.60, baseVx:  -8, baseVy:   9, baseVrot: -0.20 },
  l7: { w: 340, aspect: '1600/1080', rot: -2.0, xPct: 0.30, yPct: 0.55, baseVx:  11, baseVy:  10, baseVrot:  0.18 },
  l8: { w: 240, aspect: '1076/1600', rot:  1.5, xPct: 0.50, yPct: 0.35, baseVx:  -7, baseVy:  -9, baseVrot: -0.24 },
  l9: { w: 250, aspect: '1078/1600', rot: -3.0, xPct: 0.08, yPct: 0.78, baseVx:   9, baseVy:  -7, baseVrot:  0.23 },
}

// Per-image aspect ratios for brand galleries — used so the tile and the lightbox container
// can match whichever image is currently showing (galleries have mixed portrait + landscape)
const IMAGE_ASPECTS: Record<string, string> = {
  '/images/brand/sum-london/brand_2025_sum-london_fashion-shoot_001_standard.jpg': '1060/1600',
  '/images/brand/sum-london/brand_2025_sum-london_fashion-shoot_002_standard.jpg': '1233/1600',
  '/images/brand/sum-london/brand_2025_sum-london_fashion-shoot_003_standard.jpg': '1259/1600',
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

  '/images/live/julies-top-5/live_2026_julies-top-5_007_standard.jpg': '1600/1067',
  '/images/live/julies-top-5/live_2026_julies-top-5_008_standard.jpg': '1067/1600',
  '/images/live/julies-top-5/live_2026_julies-top-5_009_standard.jpg': '1600/1067',

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
  // Live — Busta Rhymes · South Facing Festival (2025)
  '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_001_standard.jpg': '1078/1600',
  '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_002_standard.jpg': '1076/1600',
  '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_003_standard.jpg': '1069/1600',
  '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_004_standard.jpg': '1074/1600',
  '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_005_standard.jpg': '1600/1079',
  '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_006_standard.jpg': '1073/1600',
  '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_007_standard.jpg': '1073/1600',
  '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_008_standard.jpg': '1600/1077',
  '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_009_standard.jpg': '1073/1600',
  '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_010_standard.jpg': '1078/1600',
  // Live — Sonnyjim (2025)
  '/images/live/sonnyjim-hootananny-brixton/live_2025_sonnyjim-hootananny-brixton_001_standard.jpg': '1076/1600',
  '/images/live/sonnyjim-hootananny-brixton/live_2025_sonnyjim-hootananny-brixton_002_standard.jpg': '1074/1600',
  '/images/live/sonnyjim-hootananny-brixton/live_2025_sonnyjim-hootananny-brixton_003_standard.jpg': '1078/1600',
  '/images/live/sonnyjim-hootananny-brixton/live_2025_sonnyjim-hootananny-brixton_004_standard.jpg': '1600/1065',
  '/images/live/sonnyjim-hootananny-brixton/live_2025_sonnyjim-hootananny-brixton_005_standard.jpg': '1075/1600',
  '/images/live/sonnyjim-hootananny-brixton/live_2025_sonnyjim-hootananny-brixton_006_standard.jpg': '1600/1073',
  // Live — Schoolboy Q · Roundhouse (2025)
  '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_001_standard.jpg': '1077/1600',
  '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_002_standard.jpg': '1075/1600',
  '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_003_standard.jpg': '1600/1076',
  '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_004_standard.jpg': '1600/1072',
  '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_005_standard.jpg': '1600/1079',
  '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_006_standard.jpg': '1600/1081',
  '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_007_standard.jpg': '1600/1079',
  '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_008_standard.jpg': '1600/1078',
  '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_009_standard.jpg': '1080/1600',
  '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_010_standard.jpg': '1600/1079',
  '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_011_standard.jpg': '1600/1078',
  '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_012_standard.jpg': '1078/1600',
  // Live — The Pharcyde · Spread Love (2025)
  '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_001_standard.jpg': '1600/1080',
  '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_002_standard.jpg': '1064/1600',
  '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_003_standard.jpg': '1600/1062',
  '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_004_standard.jpg': '1600/1076',
  '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_005_standard.jpg': '1600/1071',
  '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_006_standard.jpg': '1600/1064',
  '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_007_standard.jpg': '1090/1600',
  '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_008_standard.jpg': '1600/1065',
  '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_009_standard.jpg': '1600/1072',
  '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_010_standard.jpg': '1600/1066',
  '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_011_standard.jpg': '1056/1600',
  // Live — WSG · Jazz Cafe Festival (2025)
  '/images/live/westside-gunn-jazz-cafe/live_2025_westside-gunn-jazz-cafe_001_standard.jpg': '1076/1600',
  '/images/live/westside-gunn-jazz-cafe/live_2025_westside-gunn-jazz-cafe_002_standard.jpg': '1583/1600',
  '/images/live/westside-gunn-jazz-cafe/live_2025_westside-gunn-jazz-cafe_003_standard.jpg': '1600/1075',
  '/images/live/westside-gunn-jazz-cafe/live_2025_westside-gunn-jazz-cafe_004_standard.jpg': '1600/1083',
  '/images/live/westside-gunn-jazz-cafe/live_2025_westside-gunn-jazz-cafe_005_standard.jpg': '1600/1068',
  '/images/live/westside-gunn-jazz-cafe/live_2025_westside-gunn-jazz-cafe_006_standard.jpg': '1600/1074',
  '/images/live/westside-gunn-jazz-cafe/live_2025_westside-gunn-jazz-cafe_007_standard.jpg': '1078/1600',
  '/images/live/westside-gunn-jazz-cafe/live_2025_westside-gunn-jazz-cafe_008_standard.jpg': '1081/1600',
  // Live — Freddie Gibbs · QB NYC (2025)
  '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_001_standard.jpg': '1078/1600',
  '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_002_standard.jpg': '1079/1600',
  '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_003_standard.jpg': '1600/1073',
  '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_004_standard.jpg': '1600/1077',
  '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_005_standard.jpg': '1600/1080',
  '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_006_standard.jpg': '1600/1081',
  '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_007_standard.jpg': '1600/1075',
  '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_008_standard.jpg': '1073/1600',
  '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_009_standard.jpg': '1600/1075',
  '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_010_standard.jpg': '1077/1600',
  '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_011_standard.jpg': '1600/1077',
  '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_012_standard.jpg': '1600/1075',
  '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_013_standard.png': '1600/1525',
  '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_014_standard.png': '1600/1067',
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
  // Long dimension of the configured tile (height for portrait, width for landscape),
  // scaled by TILE_SIZE_SCALE so this stays in lockstep with getDims.
  const baseLong = cfgAspectNum >= 1 ? cfg.w : Math.round(cfg.w / cfgAspectNum)
  const longDim = baseLong * TILE_SIZE_SCALE
  if (currAspectNum >= 1) {
    // Landscape — long dim is width
    return { w: longDim, h: Math.round(longDim / currAspectNum) }
  }
  // Portrait — long dim is height
  return { w: Math.round(longDim * currAspectNum), h: longDim }
}

const PROJECTS: Project[] = [
  // Brand 2025
  {
    id: 'b1', kind: 'photo', title: 'Sum London · reworked 501 horse face skirt', category: 'Brand', year: '2025', color: '#1565C0',
    src: '/images/brand/sum-london/brand_2025_sum-london_fashion-shoot_001_standard.jpg',
    gallery: [
      '/images/brand/sum-london/brand_2025_sum-london_fashion-shoot_001_standard.jpg',
      '/images/brand/sum-london/brand_2025_sum-london_fashion-shoot_002_standard.jpg',
      '/images/brand/sum-london/brand_2025_sum-london_fashion-shoot_003_standard.jpg',
    ],
  },
  {
    id: 'b2', kind: 'photo', title: 'yosqi · Autumn 25', category: 'Brand', year: '2025', color: '#2C3E50',
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
    id: 'b3', kind: 'photo', title: '22impact · Model shoot', category: 'Brand', year: '2025', color: '#1A2B3C',
    src: '/images/brand/22impact/brand_2025_22impact_005_standard.jpg',
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
    id: 'c1', kind: 'photo', title: 'voice of Mauritius · Notting Hill Carnival', category: 'Cultural', year: '2025', color: '#F2B800',
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
      '/images/live/julies-top-5/live_2026_julies-top-5_007_standard.jpg',
      '/images/live/julies-top-5/live_2026_julies-top-5_008_standard.jpg',
      '/images/live/julies-top-5/live_2026_julies-top-5_009_standard.jpg',
    ],
  },
  {
    id: 'l2', kind: 'photo', title: 'Jazz Cafe Festival', category: 'Live', year: '2024', color: '#C8432A',
    src: '/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_005_standard.jpg',
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
  {
    id: 'l4', kind: 'photo', title: 'Busta Rhymes · South Facing Festival', category: 'Live', year: '2025', color: '#C8432A',
    src: '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_001_standard.jpg',
    gallery: [
      '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_001_standard.jpg',
      '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_002_standard.jpg',
      '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_003_standard.jpg',
      '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_004_standard.jpg',
      '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_005_standard.jpg',
      '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_006_standard.jpg',
      '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_007_standard.jpg',
      '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_008_standard.jpg',
      '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_009_standard.jpg',
      '/images/live/southfacing-festival-hiphop-back-in-the-day/live_2025_southfacing-festival_hiphop-back-in-the-day_010_standard.jpg',
    ],
  },
  {
    id: 'l5', kind: 'photo', title: 'Sonnyjim · Hootananny Brixton', category: 'Live', year: '2025', color: '#C8432A',
    src: '/images/live/sonnyjim-hootananny-brixton/live_2025_sonnyjim-hootananny-brixton_006_standard.jpg',
    gallery: [
      '/images/live/sonnyjim-hootananny-brixton/live_2025_sonnyjim-hootananny-brixton_001_standard.jpg',
      '/images/live/sonnyjim-hootananny-brixton/live_2025_sonnyjim-hootananny-brixton_002_standard.jpg',
      '/images/live/sonnyjim-hootananny-brixton/live_2025_sonnyjim-hootananny-brixton_003_standard.jpg',
      '/images/live/sonnyjim-hootananny-brixton/live_2025_sonnyjim-hootananny-brixton_004_standard.jpg',
      '/images/live/sonnyjim-hootananny-brixton/live_2025_sonnyjim-hootananny-brixton_005_standard.jpg',
      '/images/live/sonnyjim-hootananny-brixton/live_2025_sonnyjim-hootananny-brixton_006_standard.jpg',
    ],
  },
  {
    id: 'l6', kind: 'photo', title: 'Schoolboy Q · Roundhouse', category: 'Live', year: '2025', color: '#C8432A',
    src: '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_008_standard.jpg',
    gallery: [
      '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_001_standard.jpg',
      '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_002_standard.jpg',
      '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_003_standard.jpg',
      '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_004_standard.jpg',
      '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_005_standard.jpg',
      '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_006_standard.jpg',
      '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_007_standard.jpg',
      '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_008_standard.jpg',
      '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_009_standard.jpg',
      '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_010_standard.jpg',
      '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_011_standard.jpg',
      '/images/live/roundhouse-schoolboy-q/live_2025_roundhouse_schoolboy-q_012_standard.jpg',
    ],
  },
  {
    id: 'l7', kind: 'photo', title: 'The Pharcyde · O2 Kentish Town', category: 'Live', year: '2025', color: '#C8432A',
    src: '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_010_standard.jpg',
    gallery: [
      '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_001_standard.jpg',
      '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_002_standard.jpg',
      '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_003_standard.jpg',
      '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_004_standard.jpg',
      '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_005_standard.jpg',
      '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_006_standard.jpg',
      '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_007_standard.jpg',
      '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_008_standard.jpg',
      '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_009_standard.jpg',
      '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_010_standard.jpg',
      '/images/live/pharcyde-o2-kentish-town/live_2025_pharcyde-o2-kentish-town_011_standard.jpg',
    ],
  },
  {
    id: 'l8', kind: 'photo', title: 'Westside Gunn · Jazz Cafe', category: 'Live', year: '2025', color: '#C8432A',
    src: '/images/live/westside-gunn-jazz-cafe/live_2025_westside-gunn-jazz-cafe_001_standard.jpg',
    gallery: [
      '/images/live/westside-gunn-jazz-cafe/live_2025_westside-gunn-jazz-cafe_001_standard.jpg',
      '/images/live/westside-gunn-jazz-cafe/live_2025_westside-gunn-jazz-cafe_002_standard.jpg',
      '/images/live/westside-gunn-jazz-cafe/live_2025_westside-gunn-jazz-cafe_003_standard.jpg',
      '/images/live/westside-gunn-jazz-cafe/live_2025_westside-gunn-jazz-cafe_004_standard.jpg',
      '/images/live/westside-gunn-jazz-cafe/live_2025_westside-gunn-jazz-cafe_005_standard.jpg',
      '/images/live/westside-gunn-jazz-cafe/live_2025_westside-gunn-jazz-cafe_006_standard.jpg',
      '/images/live/westside-gunn-jazz-cafe/live_2025_westside-gunn-jazz-cafe_007_standard.jpg',
      '/images/live/westside-gunn-jazz-cafe/live_2025_westside-gunn-jazz-cafe_008_standard.jpg',
    ],
  },
  {
    id: 'l9', kind: 'photo', title: 'Freddie Gibbs · O2 Brixton', category: 'Live', year: '2026', color: '#C8432A',
    src: '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_014_standard.png',
    gallery: [
      '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_001_standard.jpg',
      '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_002_standard.jpg',
      '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_003_standard.jpg',
      '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_004_standard.jpg',
      '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_005_standard.jpg',
      '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_006_standard.jpg',
      '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_007_standard.jpg',
      '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_008_standard.jpg',
      '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_009_standard.jpg',
      '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_010_standard.jpg',
      '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_011_standard.jpg',
      '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_012_standard.jpg',
      '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_013_standard.png',
      '/images/live/freddie-gibbs-o2-brixton/live_2026_freddie-gibbs-o2-brixton_014_standard.png',
    ],
  },
]

function parseAspect(a: string): number {
  const [w, h] = a.split('/').map(Number); return w / h
}
// Single multiplier for the photo tile sizes on the homepage canvas. Set to 1
// for the original layout, 2 to double everything, etc. Position config (xPct/yPct)
// is unchanged — only the tile dimensions are scaled.
const TILE_SIZE_SCALE = 1

function getDims(id: string): { w: number; h: number } {
  const mobile = typeof window !== 'undefined' && window.innerWidth < 768
  const s = mobile ? 0.65 : 1
  if (id === 'logo') { const sz = mobile ? LOGO_SIZE_MOBILE : LOGO_SIZE; return { w: sz, h: sz } }
  // About portrait/logo get their own mobile targets (not shared `s`) so we can
  // tune them independently of the general 0.65 photo scale.
  if (id === 'aboutPortrait') { const w = mobile ? 200 : 340; return { w, h: Math.round(w * 4 / 3) } }
  if (id === 'aboutLogo')     { return mobile ? { w: 155, h: 155 } : { w: 280, h: 280 } }
  const cfg = PHOTO_CFG[id]
  if (!cfg) return { w: Math.round(200 * s), h: Math.round(200 * s) }
  const w = cfg.w * TILE_SIZE_SCALE * s
  return { w: Math.round(w), h: Math.round(w / parseAspect(cfg.aspect)) }
}
// Single dial for how fast everything drifts at steady state. Lower = slower.
// Velocity ramps from 0 to (base * VELOCITY_SCALE) over the first second via physics damping.
const VELOCITY_SCALE = 0.5

// Colour stops shared by the bg-hue slider's CSS gradient AND the applied background.
// Sweeps black → deep violet → blue → teal → lime → yellow → orange → red → pink → white.
const BG_HUE_STOPS: { pct: number; rgb: [number, number, number] }[] = [
  { pct:   0, rgb: [  0,   0,   0] },   // black
  { pct:   8, rgb: [ 42,   0,  80] },   // deep violet
  { pct:  16, rgb: [  0,  25, 168] },   // indigo
  { pct:  25, rgb: [  0, 153, 255] },   // bright blue
  { pct:  35, rgb: [  0, 255, 204] },   // teal
  { pct:  45, rgb: [102, 255,   0] },   // lime
  { pct:  52, rgb: [255, 255,   0] },   // yellow
  { pct:  60, rgb: [255, 170,   0] },   // orange
  { pct:  68, rgb: [255,  51,   0] },   // red
  { pct:  76, rgb: [255,   0, 153] },   // magenta
  { pct:  84, rgb: [255, 102, 204] },   // pink
  { pct:  92, rgb: [255, 204, 238] },   // light pink
  { pct: 100, rgb: [255, 255, 255] },   // white
]

// Linear RGB interpolation between adjacent stops — matches what the CSS gradient
// renders, so the colour the user sees under the thumb is the colour the page gets.
function interpolateBgStops(v: number): string {
  if (v <= 0) return `rgb(${BG_HUE_STOPS[0].rgb.join(',')})`
  if (v >= 100) return `rgb(${BG_HUE_STOPS[BG_HUE_STOPS.length - 1].rgb.join(',')})`
  for (let i = 0; i < BG_HUE_STOPS.length - 1; i++) {
    const a = BG_HUE_STOPS[i], b = BG_HUE_STOPS[i + 1]
    if (v <= b.pct) {
      const t = (v - a.pct) / (b.pct - a.pct)
      const r = Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * t)
      const g = Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * t)
      const bl = Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * t)
      return `rgb(${r}, ${g}, ${bl})`
    }
  }
  return `rgb(${BG_HUE_STOPS[BG_HUE_STOPS.length - 1].rgb.join(',')})`
}

function buildInitialState(vw: number, vh: number): Record<string, PhysicsState> {
  const s: Record<string, PhysicsState> = {}
  const isMobile = vw < 768
  const vScale = isMobile ? VELOCITY_SCALE * 0.5 : VELOCITY_SCALE
  const logoSz = isMobile ? LOGO_VISUAL_SIZE_MOBILE : LOGO_VISUAL_SIZE
  s['logo'] = {
    x: (vw - logoSz) / 2,
    y: -logoSz * 0.30,
    rot: 0,
    vx: 0, vy: 0, vrot: 0,
    baseVx: LOGO_INIT.baseVx * vScale,
    baseVy: LOGO_INIT.baseVy * vScale,
    baseVrot: LOGO_INIT.baseVrot * vScale,
  }
  let photoCount = 0
  PROJECTS.forEach(({ id }) => {
    const cfg = PHOTO_CFG[id]; if (!cfg) return
    if (isMobile && photoCount >= 6) return
    photoCount++
    const { w, h } = getDims(id)
    s[id] = {
      x: cfg.xPct*(vw-w), y: cfg.yPct*(vh-h), rot: cfg.rot,
      vx: 0, vy: 0, vrot: 0,
      baseVx: cfg.baseVx * vScale,
      baseVy: cfg.baseVy * vScale,
      baseVrot: cfg.baseVrot * vScale,
    }
  })
  return s
}

// ─── Ticker drag / coast helper ─────────────────────────────────────────────
// Pure function — no React deps. Works identically for mouse and touch.
// Mouse events attach via JSX; touch events attach via useEffect (passive:false).
type TickerDrag = { dragging: boolean; x: number; vel: number; lastT: number; lastX: number }
function makeTickerHandlers(
  dragRef:  { current: TickerDrag },
  trackRef: { current: HTMLDivElement | null },
  rafRef:   { current: number },
  duration: number,
) {
  const start = (clientX: number, t: number) => {
    const el = trackRef.current; if (!el) return
    cancelAnimationFrame(rafRef.current)
    const x = new DOMMatrix(getComputedStyle(el).transform).m41
    el.style.animation = 'none'
    el.style.transform = `translateX(${x}px)`
    const d = dragRef.current
    d.dragging = true; d.x = x; d.vel = 0; d.lastT = t; d.lastX = clientX
  }
  const move = (clientX: number, t: number) => {
    const d = dragRef.current; if (!d.dragging) return
    const el = trackRef.current; if (!el) return
    const halfW = el.offsetWidth / 2
    const dt = t - d.lastT; const dx = clientX - d.lastX
    d.vel = dt > 0 ? dx / dt : 0
    d.lastT = t; d.lastX = clientX
    d.x += dx
    if (d.x > 0) d.x -= halfW
    if (d.x < -halfW) d.x += halfW
    el.style.transform = `translateX(${d.x}px)`
  }
  const end = () => {
    const d = dragRef.current; if (!d.dragging) return
    d.dragging = false
    const el = trackRef.current; if (!el) return
    const halfW = el.offsetWidth / 2
    const coast = () => {
      d.x += d.vel * 16; d.vel *= 0.95
      if (d.x > 0) d.x -= halfW
      if (d.x < -halfW) d.x += halfW
      el.style.transform = `translateX(${d.x}px)`
      if (Math.abs(d.vel) < 0.031) {
        let x = d.x % -halfW; if (x > 0) x -= halfW
        const delay = -(Math.abs(x) / halfW) * duration
        el.style.animation = `tickerScroll ${duration}s linear ${delay}s infinite`
        el.style.transform = ''
        return
      }
      rafRef.current = requestAnimationFrame(coast)
    }
    rafRef.current = requestAnimationFrame(coast)
  }
  return { start, move, end }
}

export default function HomePage() {
  // Mobile flag — drives how many tiles render and their size. Starts false so the
  // first client render matches the server (no hydration mismatch), then the effect
  // flips it on small screens. Kept in sync with the physics-side window.innerWidth
  // checks in getDims / buildInitialState.
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    const setVh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
    check()
    setVh()
    window.addEventListener('resize', check)
    window.addEventListener('resize', setVh)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('resize', setVh)
    }
  }, [])

  // Background colour picker — slider sweeps from black → vibrant rainbow → white.
  // The same stops table drives both the CSS gradient track and the applied bg,
  // so the colour under the thumb is exactly the colour the page becomes.
  // Default value = 100 (right end = white), matching the original cream/white bg.
  const [bgHue, setBgHue] = useState(100)

  // Compute the bg colour and its inverse for the dot in one pass — used both
  // for the page background variable AND inline-set on the dot element itself
  // (inline wins specificity so the dot is always the inverse colour).
  const bgColour = interpolateBgStops(bgHue)
  const dotColour = (() => {
    const m = bgColour.match(/\d+/g)
    if (!m || m.length < 3) return '#0a0a0a'
    const [r, g, b] = m.map(Number)
    return `rgb(${255 - r}, ${255 - g}, ${255 - b})`
  })()

  // Text colour = exact RGB inversion of the background (255 − each channel).
  // Applied as --color-text-inverted on <main> so every descendant inherits it,
  // and also pushed onto :root so it is available on any future page.
  // Recomputed on every render (i.e. every slider move) — real-time update.
  const textColour = (() => {
    const m = bgColour.match(/\d+/g)
    if (!m || m.length < 3) return 'rgb(245,245,245)'
    const [r, g, b] = m.map(Number)
    return `rgb(${255 - r},${255 - g},${255 - b})`
  })()

  useEffect(() => {
    document.documentElement.style.setProperty('--color-bg-default',      bgColour)
    document.documentElement.style.setProperty('--color-text-inverted',   textColour)
  }, [bgColour, textColour])

  // Work overlay — bottom sheet, slides up to open, down to close. Clicking a project
  // closes the sheet and hands off to the existing photo lightbox (FLIP from canvas tile).
  const [workMounted, setWorkMounted] = useState(false)   // in the DOM
  const [workVisible, setWorkVisible] = useState(false)   // animation state — true = at translateY(0)
  // Mobile burger menu — fades in/out. Only shown on small screens.
  const [menuOpen,      setMenuOpen]      = useState(false)
  const [menuVisible,   setMenuVisible]   = useState(false)
  // Tracks whether the currently-open lightbox was launched from the work index.
  // If yes, closing the lightbox returns to work instead of back to the canvas.
  const cameFromWorkRef = useRef(false)

  // About panel — same FLIP pick-up/put-down system as photo viewer
  const [aboutOpen,    setAboutOpen]    = useState(false)   // mounted
  const [aboutVisible, setAboutVisible] = useState(false)   // animation state
  // `aboutSettled` is true only AFTER the slide-open animation completes.
  // Used to gate the portrait + logo onPointerMove handlers so they don't
  // fire during the 320ms slide (the function call + bail check on every
  // pointermove adds main-thread work that compounds with the panel's
  // mix-blend-mode repaints, causing jitter).
  const [aboutSettled, setAboutSettled] = useState(false)
  const [logoSource,   setLogoSource]   = useState({ x: 0, y: 0, scale: 1, rot: 0 })
  const [activePhoto,  setActivePhoto]  = useState<Project | null>(null)
  const [lbZoom,       setLbZoom]       = useState(1)
  const [lbVisible,    setLbVisible]    = useState(false)
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
  const visualElRefs = useRef<Record<string, HTMLElement | null>>({})
  const posRef     = useRef<Record<string, PhysicsState>>({})
  const rafRef     = useRef<number | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  const dragRef    = useRef<DragState | null>(null)
  const didDragRef     = useRef(false)
  const tickerTrackRef = useRef<HTMLDivElement | null>(null)
  const tickerRafRef   = useRef<number>(0)
  const tickerDragRef  = useRef({ dragging: false, x: 0, vel: 0, lastT: 0, lastX: 0 })
  // About panel — name ticker
  const nameTickerTrackRef   = useRef<HTMLDivElement | null>(null)
  const nameTickerRafRef     = useRef<number>(0)
  const nameTickerDragRef    = useRef({ dragging: false, x: 0, vel: 0, lastT: 0, lastX: 0 })
  const nameTickerWrapperRef    = useRef<HTMLDivElement | null>(null)
  const desktopTickerWrapperRef = useRef<HTMLDivElement | null>(null)
  const mobileTickerWrapperRef  = useRef<HTMLDivElement | null>(null)
  // Stable handler objects — created once, shared between JSX mouse events and native touch listeners
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const nameTickerH      = useMemo(() => makeTickerHandlers(nameTickerDragRef, nameTickerTrackRef, nameTickerRafRef, 16), [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const testimonialH     = useMemo(() => makeTickerHandlers(tickerDragRef, tickerTrackRef, tickerRafRef, 60), [])
  // Pan / drag: entirely direct DOM — no React state during gesture, zero latency
  const lbZoomLayerRef  = useRef<HTMLDivElement | null>(null)
  const lbCardRef       = useRef<HTMLDivElement | null>(null)  // photo card
  const lbPanRef        = useRef({ x: 0, y: 0 })
  const lbPanBaseRef    = useRef({ x: 0, y: 0 })
  const lbPanStartRef   = useRef({ x: 0, y: 0 })
  const lbPanningRef    = useRef(false)
  const lbDidPanRef     = useRef(false)
  const lbZoomRef       = useRef(1)

  // Touch tracking — swipe + pinch for mobile
  const lbTouchRef    = useRef<{ x: number; y: number } | null>(null)   // 1-finger start
  const lbPinchRef    = useRef<{ dist: number; zoom: number } | null>(null)  // 2-finger start
  const lbWasTouchRef   = useRef(false)   // suppress synthetic click after touchend
  const lbDoubleTapRef  = useRef<{ time: number; x: number; y: number } | null>(null)
  const lbOpenTimeRef   = useRef(Date.now())
  const prefersReducedMotionRef = useRef(false)

  // Smooth ease — no bounce/overshoot on zoom
  const ZOOM_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

  const applyLbTransform = useCallback((z: number, px: number, py: number, animated: boolean) => {
    const el = lbZoomLayerRef.current; if (!el) return
    el.style.transition = (animated && !prefersReducedMotionRef.current) ? `transform 0.42s ${ZOOM_EASE}` : 'none'
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
    if (!activePhoto) setGalleryIndex(0)
    // Reset crossfade state — no outgoing image when (re)opening or closing
    if (galleryTimerRef.current) { clearTimeout(galleryTimerRef.current); galleryTimerRef.current = null }
    setGalleryPrev(null)
    if (activePhoto) requestAnimationFrame(() => setLbVisible(true))
  }, [activePhoto, applyLbTransform])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotionRef.current = mq.matches
    const handler = (ev: MediaQueryListEvent) => { prefersReducedMotionRef.current = ev.matches }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Navigate within the job's gallery — directional two-layer slide.
  // Outgoing image slides off opposite to direction, incoming slides in from direction.
  // Implementation: paint the layers at their START offsets (no transition), then on the
  // next frame flip to END (with transition enabled). Pure state — no CSS keyframes needed.
  const navigate = useCallback((dir: 1 | -1) => {
    const photo = activePhoto
    if (!photo || photo.gallery.length <= 1) return
    if (galleryTimerRef.current) clearTimeout(galleryTimerRef.current)
    // Reset zoom/pan so each new image starts at 1×
    lbZoomRef.current = 1
    lbPanRef.current  = { x: 0, y: 0 }
    lbPanBaseRef.current = { x: 0, y: 0 }
    setLbZoom(1)
    applyLbTransform(1, 0, 0, false)
    const oldIdx = galleryIndexRef.current
    setGalleryDir(dir)
    setGalleryPrev(oldIdx)
    setGalleryIndex((oldIdx + dir + photo.gallery.length) % photo.gallery.length)
    setGalleryPhase('start')
    // Two rAFs — first ensures the browser paints the 'start' frame, second flips to 'end'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setGalleryPhase('end'))
    })
    galleryTimerRef.current = setTimeout(() => {
      setGalleryPrev(null)
      setGalleryPhase('idle')
    }, 350)
  }, [activePhoto, applyLbTransform])

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

  const openAbout = useCallback(() => {
    setCanvasScaled(true)
    setAboutOpen(true)
  }, [])

  const closeAbout = useCallback(() => {
    setCanvasScaled(false)
    setAboutVisible(false)
    setTimeout(() => setAboutOpen(false), 340)
  }, [])

  const openMenu  = useCallback(() => {
    setMenuOpen(true)
    requestAnimationFrame(() => setMenuVisible(true))
  }, [])
  const closeMenu = useCallback(() => {
    setMenuVisible(false)
    // Delay unmount until the 320ms slide-down on the menu content finishes.
    setTimeout(() => setMenuOpen(false), 320)
  }, [])

  // Hue picker — close when the user taps outside on mobile.
  // We use `capture: true` so the pointerdown is caught before any other handler
  // (e.g. canvas drag) can swallow it. The check is quick and bails immediately
  // Mount/unmount lifecycle for about panel (mirrors activePhoto useEffect)
  useEffect(() => {
    if (aboutOpen) requestAnimationFrame(() => setAboutVisible(true))
    else setAboutVisible(false)
  }, [aboutOpen])

  // Arm `aboutSettled` ~340ms after aboutVisible flips true (slightly longer
  // than the 320ms slide-in transition). Reset immediately on close so the
  // pointer-move handlers detach as soon as the close slide starts.
  useEffect(() => {
    if (aboutVisible) {
      const t = setTimeout(() => setAboutSettled(true), 340)
      return () => clearTimeout(t)
    }
    setAboutSettled(false)
  }, [aboutVisible])

  // Physics init for about panel — portrait + logo start in a deliberate scrapbook
  // arrangement (portrait centred near the top, logo overlapping its bottom), then
  // drift apart very slowly so the layout feels settled, not chaotic.
  useEffect(() => {
    if (!aboutOpen) {
      delete posRef.current['aboutPortrait']
      delete posRef.current['aboutLogo']
      return
    }
    const vw = window.innerWidth, vh = window.innerHeight
    const isMob = vw < 768
    const vScale = isMob ? VELOCITY_SCALE * 0.5 : VELOCITY_SCALE
    const { w: pW, h: pH } = getDims('aboutPortrait')
    const { w: lW, h: lH } = getDims('aboutLogo')

    // Portrait: horizontally centred, upper middle between ticker and text block.
    const pX = Math.round(isMob ? vw * 0.5 - 100 : vw * 0.5 - 130)
    const pY = Math.round(isMob ? vh * 0.20 : vh * 0.17)

    // Logo: centred horizontally over portrait, one-third down — uses rendered size if available.
    const portraitRect = elRefs.current['aboutPortrait']?.getBoundingClientRect()
    const portraitW = portraitRect ? portraitRect.width  : 260
    const portraitH = portraitRect ? portraitRect.height : 340
    const lX = Math.round(pX + portraitW / 2 - lW / 2)
    const lY = Math.round(pY + portraitH / 3)

    posRef.current['aboutPortrait'] = {
      x: pX, y: pY, rot: -1.5,
      vx: 0, vy: 0, vrot: 0,
      baseVx: -7 * vScale, baseVy: isMob ? -6 * vScale : 5 * vScale, baseVrot:  0.18 * vScale,
    }
    posRef.current['aboutLogo'] = {
      x: lX, y: lY, rot: 2.5,
      vx: 0, vy: 0, vrot: 0,
      baseVx: 6 * vScale, baseVy: 4 * vScale, baseVrot: 0.2 * vScale,
    }

    const pel  = elRefs.current['aboutPortrait']
    const pelv = visualElRefs.current['aboutPortrait']
    const lel  = elRefs.current['aboutLogo']
    const lelv = visualElRefs.current['aboutLogo']
    const pp   = posRef.current['aboutPortrait']
    const lp   = posRef.current['aboutLogo']
    if (pp) {
      const t = `translate3d(${pp.x}px,${pp.y}px,0) rotate(${pp.rot}deg)`
      if (pel) pel.style.transform = t
      if (pelv) pelv.style.transform = t
    }
    if (lp) {
      const t = `translate3d(${lp.x}px,${lp.y}px,0) rotate(${lp.rot}deg)`
      if (lel) lel.style.transform = t
      if (lelv) lelv.style.transform = t
    }
    // Reset name ticker to the start of the string on every open so it never
    // resumes mid-name from a stale transform left by a previous drag interaction.
    if (nameTickerTrackRef.current) {
      nameTickerTrackRef.current.style.transform = ''
      nameTickerTrackRef.current.style.animation = 'tickerScroll 16s linear infinite'
    }
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
    // Reset zoom/pan eagerly so the DOM element always opens at 1× — belt-and-suspenders
    // alongside the useEffect that fires after the new activePhoto renders.
    setLbZoom(1)
    lbZoomRef.current = 1
    lbPanRef.current  = { x: 0, y: 0 }
    lbPanBaseRef.current = { x: 0, y: 0 }
    if (lbZoomLayerRef.current) {
      lbZoomLayerRef.current.style.transition = 'none'
      lbZoomLayerRef.current.style.transform  = 'scale(1) translate(0px, 0px)'
    }
    setCanvasScaled(true)   // canvas starts zooming out
    lbOpenTimeRef.current = Date.now()
    setGalleryIndex(0)
    setActivePhoto(proj)
  }, [])

  // ── Work overlay — floats above the canvas, no opaque background ─────────
  // Behaves like the photo viewer: canvas scales back, the work content
  // floats above. Slides up to enter, down to exit. Clicking a project hands
  // off to the existing lightbox (FLIP from canvas tile), the slide-down and
  // FLIP-up overlap so the photo appears to rise out of the canvas as the
  // sheet uncovers it.
  const openWork = useCallback(() => {
    setCanvasScaled(true)         // pull the canvas back, same as photo viewer
    setWorkMounted(true)
    requestAnimationFrame(() => setWorkVisible(true))
  }, [])

  const closeWork = useCallback(() => {
    setWorkVisible(false)
    setCanvasScaled(false)        // canvas zooms back as the sheet slides away
    setTimeout(() => setWorkMounted(false), 320)
  }, [])

  // Click a project from inside the work sheet → close sheet + open lightbox.
  // Don't unscale the canvas — openLightbox keeps it scaled so the FLIP lands cleanly.
  // Mark the launch source so closing the lightbox returns to the work index, not the canvas.
  const openFromWork = useCallback((proj: Project) => {
    cameFromWorkRef.current = true
    setWorkVisible(false)
    setTimeout(() => openLightbox(proj), 160)   // start lightbox while sheet is halfway off
    setTimeout(() => setWorkMounted(false), 320)
  }, [openLightbox])

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
    // If the lightbox was launched from the work index, KEEP the canvas scaled —
    // we're about to re-open the work sheet right on top of it. Otherwise zoom back.
    if (!cameFromWorkRef.current) setCanvasScaled(false)
    lbIsClosingRef.current = true
    setLbVisible(false)
    setTimeout(() => {
      setActivePhoto(null)
      lbIsClosingRef.current = false
      frozenPhotoRef.current = null  // unfreeze — physics resumes
      // Hand back to the work index if that's where this lightbox came from
      if (cameFromWorkRef.current) {
        cameFromWorkRef.current = false
        setWorkMounted(true)
        requestAnimationFrame(() => setWorkVisible(true))
      }
    }, 340)
  }, [activePhoto])

  // Keyboard: arrow keys to navigate gallery, Escape to close any open overlay
  // Placed after the close handlers so they're all in scope
  useEffect(() => {
    if (!activePhoto && !aboutOpen && !workMounted) return
    const onKey = (e: KeyboardEvent) => {
      if (workMounted) { if (e.key === 'Escape') closeWork(); return }
      if (aboutOpen)   { if (e.key === 'Escape') closeAbout(); return }
      if (e.key === 'ArrowRight') navigate(1)
      if (e.key === 'ArrowLeft')  navigate(-1)
      if (e.key === 'Escape')     closeLightbox()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activePhoto, aboutOpen, workMounted, navigate, closeLightbox, closeAbout, closeWork])

  // EFFECT — unified native touch listeners for all three ticker wrappers.
  // Mouse events live on JSX directly. Touch must be native so { passive: false }
  // lets touchmove call preventDefault() and stop the browser stealing the gesture.
  useEffect(() => {
    function attachTouch(
      el: HTMLDivElement | null,
      h: { start: (x: number, t: number) => void; move: (x: number, t: number) => void; end: () => void },
    ) {
      if (!el) return () => {}
      const onStart  = (e: TouchEvent) => { const t = e.touches[0]; if (t) h.start(t.clientX, e.timeStamp) }
      const onMove   = (e: TouchEvent) => { e.preventDefault(); const t = e.touches[0]; if (t) h.move(t.clientX, e.timeStamp) }
      el.addEventListener('touchstart',  onStart, { passive: false })
      el.addEventListener('touchmove',   onMove,  { passive: false })
      el.addEventListener('touchend',    h.end)
      el.addEventListener('touchcancel', h.end)
      return () => {
        el.removeEventListener('touchstart',  onStart)
        el.removeEventListener('touchmove',   onMove)
        el.removeEventListener('touchend',    h.end)
        el.removeEventListener('touchcancel', h.end)
      }
    }
    const cleanups = [
      attachTouch(nameTickerWrapperRef.current,    nameTickerH),
      attachTouch(desktopTickerWrapperRef.current, testimonialH),
      attachTouch(mobileTickerWrapperRef.current,  testimonialH),
    ]
    return () => cleanups.forEach(c => c())
  }, [isMobile, nameTickerH, testimonialH])

  // EFFECT 1 — write initial transforms synchronously before first paint
  useClientLayoutEffect(() => {
    const vw = window.innerWidth; const vh = window.innerHeight
    posRef.current = buildInitialState(vw, vh)
    for (const [id, pos] of Object.entries(posRef.current)) {
      const t = `translate3d(${pos.x}px,${pos.y}px,0) rotate(${pos.rot}deg)`
      const el = elRefs.current[id]; if (el) el.style.transform = t
      const vel = visualElRefs.current[id]; if (vel) vel.style.transform = t
    }
    // Sync isMobile state so the JSX tile filter matches the physics state built above
    setIsMobile(vw < 768)
  }, [])

  // EFFECT 2 — physics loop
  useEffect(() => {
    let prev = performance.now()
    function tick(now: number) {
      if (document.visibilityState !== 'visible') {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      const rawDt = now - prev
      const dt = Math.min(Math.max(rawDt, 0), 100) / 1000
      prev = now
      if (dt === 0) { rafRef.current = requestAnimationFrame(tick); return }
      const vw = window.innerWidth; const vh = window.innerHeight
      for (const id of Object.keys(posRef.current)) {
        const pos = posRef.current[id]
        if (!pos || dragRef.current?.id === id) continue
        // Freeze physics during return animations so canvas elements meet the viewer exactly
        if (frozenPhotoRef.current?.id === id) {
          const f = frozenPhotoRef.current
          const t = `translate3d(${f.x}px,${f.y}px,0) rotate(${f.rot}deg)`
          const el = elRefs.current[id]; if (el) el.style.transform = t
          const vel = visualElRefs.current[id]; if (vel) vel.style.transform = t
          continue
        }
        if (id === 'logo' && frozenLogoRef.current) {
          const f = frozenLogoRef.current
          const t = `translate3d(${f.x}px,${f.y}px,0) rotate(${f.rot}deg)`
          const el = elRefs.current['logo']; if (el) el.style.transform = t
          const vel = visualElRefs.current['logo']; if (vel) vel.style.transform = t
          continue
        }
        pos.vx   = pos.baseVx   + (pos.vx   - pos.baseVx)   * 0.985
        pos.vy   = pos.baseVy   + (pos.vy   - pos.baseVy)   * 0.985
        pos.vrot = pos.baseVrot + (pos.vrot - pos.baseVrot) * 0.985

        pos.x += pos.vx * dt; pos.y += pos.vy * dt; pos.rot += pos.vrot * dt
        // Tight rotation clamp — applies to everything (photos, letters, logo).
        // ±15° keeps the scrapbook feel without letting any element spin loose.
        if (pos.rot >  15) { pos.rot =  15; pos.vrot = Math.min(pos.vrot, 0); pos.baseVrot = -Math.abs(pos.baseVrot) }
        if (pos.rot < -15) { pos.rot = -15; pos.vrot = Math.max(pos.vrot, 0); pos.baseVrot =  Math.abs(pos.baseVrot) }
        const { w, h } = getDims(id)
        if (pos.x >  vw + 60) pos.x = -w
        if (pos.x < -w)       pos.x =  vw + 60
        if (pos.y >  vh + 60) pos.y = -h
        if (pos.y < -h)       pos.y =  vh + 60
        const t = `translate3d(${pos.x}px,${pos.y}px,0) rotate(${pos.rot}deg)`
        const el = elRefs.current[id]; if (el) el.style.transform = t
        const vel = visualElRefs.current[id]; if (vel) vel.style.transform = t
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    function startLoop() {
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      posRef.current = buildInitialState(window.innerWidth, window.innerHeight)
      for (const [id, pos] of Object.entries(posRef.current)) {
        const t = `translate3d(${pos.x}px,${pos.y}px,0) rotate(${pos.rot}deg)`
        const el = elRefs.current[id]; if (el) el.style.transform = t
        const vel = visualElRefs.current[id]; if (vel) vel.style.transform = t
      }
      setIsMobile(window.innerWidth < 768)
      prev = performance.now() - 16
      rafRef.current = requestAnimationFrame(tick)
    }
    prev = performance.now() - 16
    const startRaf = () => { rafRef.current = requestAnimationFrame(tick) }
    if (document.visibilityState === 'visible') {
      startRaf()
    } else {
      document.addEventListener('visibilitychange', function onVis() {
        if (document.visibilityState === 'visible') {
          startRaf()
          document.removeEventListener('visibilitychange', onVis)
        }
      })
    }
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) startLoop() }
    const onVisible  = () => {
      if (!document.hidden && rafRef.current === null) {
        prev = performance.now() - 16
      rafRef.current = requestAnimationFrame(tick)
      }
    }
    const onTouch = () => {
      if (rafRef.current === null) {
        prev = performance.now()
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    window.addEventListener('pageshow', onPageShow)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('touchstart', onTouch, { passive: true })
    document.addEventListener('touchstart', onTouch, { passive: true })
    return () => {
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('touchstart', onTouch)
      document.removeEventListener('touchstart', onTouch)
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
    const t = `translate3d(${pos.x}px,${pos.y}px,0) rotate(${pos.rot}deg)`
    const el = elRefs.current[d.id]; if (el) el.style.transform = t
    const vel = visualElRefs.current[d.id]; if (vel) vel.style.transform = t
  }, [])

  const onPointerUp = useCallback((_e: React.PointerEvent) => {
    const d = dragRef.current; if (!d) return
    const pos = posRef.current[d.id]
    if (pos) {
      // Carry the pointer's last velocity into the dragged item — that's it.
      // (Collision/bump against nearby items was removed: items now drift independently.)
      const dvx = (d.nx - d.px) * 60; const dvy = (d.ny - d.py) * 60
      pos.vx = dvx; pos.vy = dvy
    }
    const capturedId = d.id
    dragRef.current = null
    if (!didDragRef.current && window.innerWidth < 768 && !activePhoto) {
      const proj = PROJECTS.find(p => p.id === capturedId)
      if (proj) { lbWasTouchRef.current = true; openLightbox(proj) }
    }
  }, [activePhoto, openLightbox])

  // Lightbox pan — direct DOM, no React state, 1:1 with pointer
  const onLbImageDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation(); lbDidPanRef.current = false
    if (e.pointerType === 'touch') return  // touch handled by onLbTouch* below
    lbPanStartRef.current = { x: e.clientX, y: e.clientY }
    if (lbZoomRef.current <= 1) return  // scale=1: no pan, touch swipe handled by onLbTouchEnd
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    lbPanningRef.current = true
    lbPanBaseRef.current = { ...lbPanRef.current }
    const el = lbZoomLayerRef.current; if (el) el.style.cursor = 'grabbing'
  }, [])

  const onLbImageMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return
    const dx = e.clientX - lbPanStartRef.current.x
    const dy = e.clientY - lbPanStartRef.current.y
    if (Math.hypot(dx, dy) > 10) lbDidPanRef.current = true
    if (!lbPanningRef.current) return  // zoom=1: not panning
    const el   = lbZoomLayerRef.current
    const zoom = lbZoomRef.current
    const maxPx = el ? el.offsetWidth  * (zoom - 1) / 2 : 9999
    const maxPy = el ? el.offsetHeight * (zoom - 1) / 2 : 9999
    const px = Math.max(-maxPx, Math.min(maxPx, lbPanBaseRef.current.x + dx))
    const py = Math.max(-maxPy, Math.min(maxPy, lbPanBaseRef.current.y + dy))
    lbPanRef.current = { x: px, y: py }
    applyLbTransform(zoom, px, py, false)
  }, [applyLbTransform])

  const onLbImageUp = useCallback((e: React.PointerEvent) => {
    lbPanningRef.current = false
    const el = lbZoomLayerRef.current
    if (el) {
      el.style.cursor = lbZoomRef.current > 1 ? 'grab' : 'zoom-in'
      if (!prefersReducedMotionRef.current) el.style.transition = `transform 0.42s ${ZOOM_EASE}`
    }
    // drag-navigate (touch): handled by onLbTouchEnd
  }, [ZOOM_EASE])

  const onLbImageClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  const onLbDoubleTap = useCallback((clientX: number, clientY: number) => {
    const el = lbZoomLayerRef.current
    if (lbZoomRef.current > 1) {
      lbZoomRef.current = 1; setLbZoom(1)
      lbPanRef.current = { x: 0, y: 0 }; lbPanBaseRef.current = { x: 0, y: 0 }
      applyLbTransform(1, 0, 0, true)
    } else {
      const newZ = 2.5
      const rect = el?.getBoundingClientRect()
      const cx = rect ? clientX - (rect.left + rect.width  / 2) : 0
      const cy = rect ? clientY - (rect.top  + rect.height / 2) : 0
      const maxPx = el ? el.offsetWidth  * (newZ - 1) / 2 : 9999
      const maxPy = el ? el.offsetHeight * (newZ - 1) / 2 : 9999
      const px = Math.max(-maxPx, Math.min(maxPx, cx * (1 - newZ)))
      const py = Math.max(-maxPy, Math.min(maxPy, cy * (1 - newZ)))
      lbZoomRef.current = newZ; setLbZoom(newZ)
      lbPanRef.current = { x: px, y: py }; lbPanBaseRef.current = { x: px, y: py }
      applyLbTransform(newZ, px, py, true)
    }
  }, [applyLbTransform])

  const onLbWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault(); e.stopPropagation()
    const el = lbZoomLayerRef.current; if (!el) return
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
    const oldZ = lbZoomRef.current
    const newZ = Math.min(4, Math.max(1, oldZ * factor))
    if (newZ === oldZ) return
    const rect = el.getBoundingClientRect()
    const cx = e.clientX - (rect.left + rect.width  / 2)
    const cy = e.clientY - (rect.top  + rect.height / 2)
    const r = newZ / oldZ
    const maxPx = el.offsetWidth  * (newZ - 1) / 2
    const maxPy = el.offsetHeight * (newZ - 1) / 2
    const px = Math.max(-maxPx, Math.min(maxPx, cx * (1 - r) + lbPanRef.current.x * r))
    const py = Math.max(-maxPy, Math.min(maxPy, cy * (1 - r) + lbPanRef.current.y * r))
    lbZoomRef.current = newZ
    lbPanRef.current  = { x: px, y: py }
    lbPanBaseRef.current = { x: px, y: py }
    setLbZoom(newZ)
    applyLbTransform(newZ, px, py, false)
  }, [applyLbTransform])

  // ── Mobile touch handlers ──────────────────────────────────────────────
  // Pinch-to-zoom (2-finger) and swipe-to-navigate (1-finger, unzoomed only).
  // All decisions are made at touchend — no real-time swipe tracking.

  const onLbTouchStart = useCallback((e: React.TouchEvent) => {
    lbWasTouchRef.current = true
    if (e.touches.length === 2) {
      // 2-finger: start pinch tracking
      lbTouchRef.current = null
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      lbPinchRef.current = { dist: Math.hypot(dx, dy), zoom: lbZoomRef.current }
    } else if (e.touches.length === 1) {
      lbPinchRef.current = null
      lbTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      // Snapshot pan so deltas during this touch are relative to where we were
      if (lbZoomRef.current > 1) lbPanBaseRef.current = { ...lbPanRef.current }
      // drag-navigate (touch): handled by onLbTouchEnd
    }
  }, [])

  const onLbTouchMove = useCallback((e: React.TouchEvent) => {
    // ── 2-finger pinch zoom ───────────────────────────────────────────────
    if (e.touches.length === 2 && lbPinchRef.current) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      const z = Math.min(4, Math.max(1,
        lbPinchRef.current.zoom * (Math.hypot(dx, dy) / lbPinchRef.current.dist)
      ))
      lbZoomRef.current = z
      applyLbTransform(z, lbPanRef.current.x, lbPanRef.current.y, false)
      return
    }
    // ── 1-finger drag when unzoomed — swipe decision deferred to onLbTouchEnd ──
    // ── 1-finger pan when zoomed ─────────────────────────────────────────
    if (e.touches.length === 1 && lbTouchRef.current && lbZoomRef.current > 1) {
      const t  = e.touches[0]
      const dx = t.clientX - lbTouchRef.current.x
      const dy = t.clientY - lbTouchRef.current.y
      const el   = lbZoomLayerRef.current
      const zoom = lbZoomRef.current
      const maxPx = el ? el.offsetWidth  * (zoom - 1) / 2 : 9999
      const maxPy = el ? el.offsetHeight * (zoom - 1) / 2 : 9999
      const px = Math.max(-maxPx, Math.min(maxPx, lbPanBaseRef.current.x + dx))
      const py = Math.max(-maxPy, Math.min(maxPy, lbPanBaseRef.current.y + dy))
      lbPanRef.current = { x: px, y: py }
      applyLbTransform(zoom, px, py, false)
    }
  }, [applyLbTransform])

  const onLbTouchEnd = useCallback((e: React.TouchEvent) => {
    // Snapshot and clear the pending double-tap immediately so any early return
    // (pinch end, missing touch record, etc.) can't leave a stale first-tap entry.
    const pendingDoubleTap = lbDoubleTapRef.current
    lbDoubleTapRef.current = null

    // ── Pinch ended — commit zoom to state ─────────────────────────────
    if (lbPinchRef.current && e.touches.length < 2) {
      const z = lbZoomRef.current
      if (z < 1.3) {
        // Snapped below threshold — spring back to 1×
        lbZoomRef.current = 1; setLbZoom(1)
        lbPanRef.current = { x: 0, y: 0 }; lbPanBaseRef.current = { x: 0, y: 0 }
        applyLbTransform(1, 0, 0, true)
      } else {
        setLbZoom(z)  // commit whatever zoom the pinch landed on
      }
      lbPinchRef.current = null
      lbTouchRef.current = null
      return
    }

    // ── 1-finger: swipe (unzoomed) or double-tap or tap-to-reset (zoomed) ──
    if (!lbTouchRef.current) return
    const t  = e.changedTouches[0]
    const dx = t.clientX - lbTouchRef.current.x
    const dy = t.clientY - lbTouchRef.current.y
    lbTouchRef.current = null

    // Double-tap detection — intercepts before swipe/reset logic
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const now  = Date.now()
      if (pendingDoubleTap && now - pendingDoubleTap.time < 300 && Math.hypot(t.clientX - pendingDoubleTap.x, t.clientY - pendingDoubleTap.y) < 40) {
        if (!lbVisible) return
        if (now - lbOpenTimeRef.current < 800) return
        onLbDoubleTap(t.clientX, t.clientY)
        return
      }
      lbDoubleTapRef.current = { time: now, x: t.clientX, y: t.clientY }
    }

    if (lbZoomRef.current > 1) {
      // Tap while zoomed (tiny movement) → reset to 1×
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        lbZoomRef.current = 1; setLbZoom(1)
        lbPanRef.current = { x: 0, y: 0 }; lbPanBaseRef.current = { x: 0, y: 0 }
        applyLbTransform(1, 0, 0, true)
      }
      // Otherwise the finger was panning — already committed live in onLbTouchMove
      return
    }
    // Swipe threshold: 50 px horizontal, more horizontal than vertical
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy)) {
      if (Date.now() - lbOpenTimeRef.current < 800) return
      navigate(dx < 0 ? 1 : -1)
    }
  }, [navigate, applyLbTransform, onLbDoubleTap, lbVisible])

  const lbCfg    = activePhoto ? PHOTO_CFG[activePhoto.id] : null
  // Lightbox shape follows the current gallery image, not a fixed project aspect
  const lbCurrentSrc = activePhoto?.gallery[galleryIndex] ?? null
  const lbAspect = getSrcAspect(lbCurrentSrc, lbCfg?.aspect ?? '16/9')
  const [lbAW, lbAH] = lbAspect.split('/').map(Number)
  const lbRatio  = lbAW / lbAH

  return (
    <main
      // Root surface for text colour: --color-text-inverted is the RGB inverse of the
      // background, and color:var(--color-text-inverted) makes every
      // descendant inherit it automatically. Updates in real time as the slider moves.
      suppressHydrationWarning
      style={{ ['--color-text-inverted' as string]: textColour, color: 'var(--color-text-inverted)', maxWidth: '100vw', overflowX: 'hidden' }}
    >
      <a href="#canvas"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded">
        Skip to content
      </a>

      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-end px-6 md:px-10 h-16 pointer-events-none"
        style={{ mixBlendMode: 'difference', color: '#ffffff', opacity: 1 }}
      >
        {/* Nav fades out when any overlay (work / about / photo viewer / mobile menu) is open. */}
        {(() => {
          const navDisabled = workMounted || aboutOpen || !!activePhoto || menuOpen
          const btnPE: 'auto' | 'none' = navDisabled ? 'none' : 'auto'
          return (
        <nav
          className="flex gap-4 md:gap-6"
          aria-label="Primary navigation"
          style={{
            opacity: navDisabled ? 0 : 1,
            pointerEvents: navDisabled ? 'none' : 'auto',
            transition: 'opacity 0.18s ease',
          }}
        >
          {/* Desktop: text buttons */}
          <button
            onClick={openWork}
            className="blend-text hidden md:flex text-sm md:text-base tracking-widest lowercase text-white/60 hover:text-white transition-colors duration-200 focus:outline-none focus-visible:underline min-h-[44px] items-center"
            style={{ pointerEvents: btnPE }}
          >Work</button>
          <button
            onClick={openAbout}
            className="blend-text hidden md:flex text-sm md:text-base tracking-widest lowercase text-white/60 hover:text-white transition-colors duration-200 focus:outline-none focus-visible:underline min-h-[44px] items-center"
            style={{ pointerEvents: btnPE }}
          >About</button>

          {/* Mobile: hamburger */}
          <button
            onClick={openMenu}
            className="flex md:hidden items-center justify-center min-h-[44px] min-w-[44px] bg-transparent text-white/60 hover:text-white transition-colors focus:outline-none"
            style={{ pointerEvents: btnPE }}
            aria-label="Open menu"
          >
            <svg width="22" height="15" viewBox="0 0 22 15" fill="none" aria-hidden="true">
              <rect width="22" height="2" rx="1" fill="currentColor" />
              <rect y="6.5" width="22" height="2" rx="1" fill="currentColor" />
              <rect y="13" width="22" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>
        </nav>
          )
        })()}
      </header>

      {/* ─── Canvas ─────────────────────────────────────────────────────── */}
      <section
        id="canvas"
        ref={(el) => { sectionRef.current = el }}
        className="relative canvas-section bg-bg-default overflow-hidden"
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
          {PROJECTS.filter((_, i) => !isMobile || i < 6).map(proj => {
            const cfg = PHOTO_CFG[proj.id]; if (!cfg) return null
            // Both width AND height follow the current image's orientation, keeping the long dim
            // constant so landscape tiles aren't smaller than portrait ones from the same project.
            const currentSrc = tileSrc[proj.id] ?? proj.src
            const dims = getTileDims(proj.id, currentSrc)
            // Match the 0.65 mobile scale applied in getDims so rendered size and physics agree.
            const tileW = isMobile ? Math.round(dims.w * 0.65) : dims.w
            const tileH = isMobile ? Math.round(dims.h * 0.65) : dims.h
            const isPickedUp = activePhoto?.id === proj.id
            return (
              <div
                key={proj.id}
                ref={el => { elRefs.current[proj.id] = el as HTMLElement | null }}
                className="absolute top-0 left-0 touch-none"
                style={{
                  width: tileW, height: tileH,
                  willChange: 'transform', borderRadius: 2, overflow: 'hidden',
                  cursor: 'none', zIndex: 1,
                  // Snap invisible the moment it's picked up; snap back the instant photo lands
                  opacity: isPickedUp && canvasScaled ? 0 : 1,
                  transition: isPickedUp
                    ? (canvasScaled
                        ? 'opacity 0s'              // instant hide — photo lifts off from this spot
                        : 'opacity 0s ease 0.22s')  // snap in as viewer photo arrives (no fade)
                    : 'none',
                }}
                onPointerDown={e => { if (!activePhoto) onPointerDown(e, proj.id) }}
                onPointerUp={onPointerUp}
                onContextMenu={e => e.preventDefault()}
                onClick={() => { if (!didDragRef.current && !activePhoto) openLightbox(proj) }}
                role="button" tabIndex={0} aria-label={`${proj.title} — ${proj.category}`}
                onKeyDown={e => { if (e.key === 'Enter' && !activePhoto) openLightbox(proj) }}
              >
                {(tileSrc[proj.id] ?? proj.src)
                  ? <Image src={(tileSrc[proj.id] ?? proj.src) as string} fill alt={`${proj.title} by Nadim Kurimbokus`}
                      className="object-cover" draggable={false} sizes={`${cfg.w}px`} unoptimized />
                  : <div className="w-full h-full" style={{ backgroundColor: proj.color }} />}
                <div className="absolute inset-0" style={{ zIndex: 1, touchAction: 'none', pointerEvents: 'none' }} />
              </div>
            )
          })}

          {/* ── Logo — floats with the photos, wraps at edges, draggable ── */}
          <div
            ref={el => { elRefs.current['logo'] = el }}
            className="absolute top-0 left-0 touch-none"
            style={{
              width:  isMobile ? LOGO_VISUAL_SIZE_MOBILE : LOGO_VISUAL_SIZE,
              height: isMobile ? LOGO_VISUAL_SIZE_MOBILE : LOGO_VISUAL_SIZE,
              willChange: 'transform', zIndex: 5,
              opacity: aboutOpen ? (aboutVisible ? 0 : 1) : 1,
              transition: aboutOpen
                ? (aboutVisible ? 'opacity 0s' : 'opacity 0s ease 0.22s')
                : 'none',
            }}
          >
            <Image src="/logo.png" fill alt="Nadim Kurimbokus" style={{ objectFit: 'contain', pointerEvents: 'none' }} draggable={false} unoptimized />
            {/* Hit pad — sits over just the visible logo strip (~36% of the square's height) */}
            <div
              className="absolute left-0 touch-none"
              style={{
                top: '50%', width: '100%', height: '40%',
                transform: 'translateY(-50%)',
                cursor: 'none',
              }}
              onPointerDown={e => onPointerDown(e, 'logo')}
              onPointerUp={onPointerUp}
              onClick={() => { if (!didDragRef.current) openAbout() }}
              onContextMenu={e => e.preventDefault()}
              role="button" tabIndex={0} aria-label="About Nadim Kurimbokus"
              onKeyDown={e => { if (e.key === 'Enter') openAbout() }}
            />
          </div>
        </div>

      </section>

      {/* ─── Background colour picker — bottom-left corner, horizontal ────
          Anchored bottom:24 left:24; strip emerges to the right on hover.
          Desktop: :hover expands the strip (pure CSS).
          Mobile:  always expanded via @media — drag to pick, no JS needed. */}
      <div
        className="cpicker"
        style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 30,
          opacity: (workMounted || aboutOpen || !!activePhoto) ? 0 : 1,
          pointerEvents: (workMounted || aboutOpen || !!activePhoto) ? 'none' : 'auto',
          transition: 'opacity 0.2s ease',
        }}
        title={`Background colour ${bgHue}%`}
      >
        <div className="cpicker-strip">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={bgHue}
            onChange={e => setBgHue(Number(e.target.value))}
            className="cpicker-input"
            aria-label="Background colour"
          />
        </div>
        <div className="cpicker-dot" aria-hidden style={{ background: dotColour }} />
      </div>

      {/* ─── Mobile menu — hamburger overlay, md:hidden equivalent ────────
          Fades in/out. Sits above everything (z-[70]) so it's never clipped.
          Only rendered when menuOpen, so it has zero cost on desktop. */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[68] md:hidden"
            style={{
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              opacity: menuVisible ? 1 : 0,
              transition: 'opacity 0.22s ease',
            }}
            onClick={closeMenu}
          />
          {/* Menu content — slides up to enter, down to exit (matches the
              work overlay and about panel). Opacity hardcoded to 1 so the
              container-level mix-blend-mode never enters a fractional-opacity
              state mid-transition. */}
          <div
            className="fixed inset-0 z-[69] flex flex-col items-center justify-center gap-10 md:hidden"
            style={{
              transform: menuVisible ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
              opacity: 1,
              pointerEvents: menuVisible ? 'auto' : 'none',
              willChange: 'transform',
              mixBlendMode: 'difference',
              color: '#ffffff',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <button
              onClick={() => { closeMenu(); setTimeout(openWork, 60) }}
              className="text-4xl tracking-widest lowercase focus:outline-none focus-visible:underline min-h-[56px] flex items-center"
            >Work</button>
            <button
              onClick={() => { closeMenu(); setTimeout(openAbout, 60) }}
              className="text-4xl tracking-widest lowercase focus:outline-none focus-visible:underline min-h-[56px] flex items-center"
            >About</button>
            <button
              onClick={closeMenu}
              className="mt-6 text-sm tracking-widest lowercase focus:outline-none focus-visible:underline min-h-[44px] flex items-center"
            >Close</button>
          </div>
        </>
      )}

      {/* ─── Work overlay — floats above the scaled canvas ───────────────
          Same pattern as the photo viewer: transparent click-to-close backdrop
          underneath, content layer above with pointer-events handled per-element.
          Content slides up to enter, down to exit. */}
      {workMounted && (
        <>
          {/* Click-to-close backdrop — absorbs taps + light blur so the canvas behind
              reads as out-of-focus while the work list is foregrounded. */}
          <div
            className="fixed inset-0 z-[55]"
            style={{
              cursor: 'none',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              opacity: workVisible ? 1 : 0,
              transition: 'opacity 0.2s ease',
            }}
            onClick={closeWork}
          />
          {/* Content — slides, no background. Outer is pointer-events:none so clicks
              fall through to the backdrop; the inner panel turns events back on. */}
          <div
            className="fixed inset-0 z-[60] overflow-y-auto pointer-events-none"
            style={{
              transform: workVisible ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
              willChange: 'transform',
              // Work index is text-only — applying blend at the stacking-context
              // root inverts white text against whatever sits behind (canvas bg + photos).
              mixBlendMode: 'difference',
              color: '#ffffff',
              opacity: 1,
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Work index"
          >
            {/* Top bar — minimal, just a Close affordance */}
            <div className="blend-text flex items-center justify-between px-6 md:px-12 py-6 pointer-events-auto">
              <span className="text-sm tracking-widest lowercase">Work</span>
              <button
                onClick={closeWork}
                className="text-sm tracking-widest lowercase focus:outline-none focus-visible:underline"
              >Close</button>
            </div>

            {/* Two-column aligned index: number column (fixed width) | title (flex) | year (far right).
                Sorted newest-first by year (stable sort keeps same-year order). Sentence/title
                case (no all-caps). Tight row padding for an editorial index feel. */}
            <ol className="px-6 md:px-12 py-12 md:py-20 divide-y divide-current/15">
              {[...PROJECTS]
                .sort((a, b) => Number(b.year) - Number(a.year))
                .map((p, i) => {
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => openFromWork(p)}
                      className="blend-text group w-full flex items-baseline gap-4 md:gap-8 py-1 md:py-1.5 text-left focus:outline-none pointer-events-auto"
                    >
                      {/* Number — fixed-width left column so all titles line up */}
                      <span className="text-xl md:text-3xl tabular-nums w-9 md:w-16 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {/* Title — Geist 400, inherits --color-text-inverted from <main> */}
                      <span
                        className="tracking-tight leading-none text-4xl md:text-6xl lg:text-7xl flex-1 transition-opacity duration-200"
                      >
                        {p.title}
                      </span>
                      {/* Year — far right, always visible */}
                      <span className="text-xs tracking-widest uppercase shrink-0 self-center">
                        {p.year}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        </>
      )}

      {/* ─── About panel — always in DOM, fades in/out via opacity ─────── */}
      {/* Never conditionally removed: opacity needs the element mounted through
          both the fade-in and fade-out so the transition can complete. */}
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-[55]"
          style={{
            cursor: 'none',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            opacity: aboutVisible ? 1 : 0,
            pointerEvents: aboutVisible ? 'auto' : 'none',
            transition: 'opacity 0.3s ease-in-out',
          }}
          onClick={closeAbout}
        />

        {/* Panel — slides up to enter, down to exit (matches work overlay).
            opacity is hardcoded to 1; show/hide handled by the slide transform
            so the panel never enters a fractional-opacity state that traps the
            container-level mix-blend-mode in a sub-stacking-context. */}
        <div
          className="fixed inset-0 z-[60] pointer-events-none"
          style={{
            transform: aboutVisible ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
            opacity: 1,
            willChange: 'transform',
            mixBlendMode: 'difference',
            color: '#ffffff',
          }}
          role="dialog"
          aria-modal={aboutVisible ? 'true' : 'false'}
          aria-label="About Nadim Kurimbokus"
        >
            {/* Click-to-close layer — z:1, sits behind physics elements */}
            <div
              className="absolute inset-0"
              style={{ zIndex: 1, cursor: 'none', pointerEvents: aboutVisible ? 'auto' : 'none' }}
              onClick={closeAbout}
            />

            {/* Top bar — z:4, always readable above everything.
                Blending is inherited from the about panel root. */}
            <div
              className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 md:px-12 py-6"
              style={{ zIndex: 4, pointerEvents: aboutVisible ? 'auto' : 'none' }}
            >
              <span className="text-sm tracking-widest lowercase">About</span>
              <button
                onClick={closeAbout}
                className="text-sm tracking-widest lowercase focus:outline-none focus-visible:underline"
              >Close</button>
            </div>

          </div>

        {/* ── About PORTRAIT layer — z:56 sibling, NO blend ─────────────
            Image lives outside the blending panel root so it renders normally
            (no inversion). Mirrors the panel's slide transform so it slides
            up with the panel on open and away on close. */}
        {/* ── About PORTRAIT visual — z:56, renders image, no pointer events ── */}
        <div
          className="fixed inset-0 z-[56]"
          style={{
            transform: aboutVisible ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
            willChange: 'transform',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <div
            ref={el => { visualElRefs.current['aboutPortrait'] = el }}
            className="absolute top-0 left-0 touch-none"
            style={{
              width:        isMobile ? 200 : 340,
              height:       isMobile ? Math.round(200 * 4 / 3) : Math.round(340 * 4 / 3),
              willChange:   'transform',
              borderRadius: 2,
              overflow:     'hidden',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            <Image
              src="/images/portrait.jpg"
              width={1080}
              height={1440}
              priority
              alt="Nadim Kurimbokus"
              style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
              unoptimized
            />
          </div>
        </div>

        {/* ── About LOGO visual — z:57, renders image, no pointer events ────── */}
        <div
          className="fixed inset-0 z-[57]"
          style={{
            transform: aboutVisible ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
            willChange: 'transform',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <div
            ref={el => { visualElRefs.current['aboutLogo'] = el }}
            className="absolute top-0 left-0 touch-none"
            style={{
              width:      isMobile ? 155 : 280,
              height:     isMobile ? 155 : 280,
              willChange: 'transform',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            <Image
              src="/logo.png"
              fill
              alt=""
              style={{ objectFit: 'contain', pointerEvents: 'none' }}
              unoptimized
            />
          </div>
        </div>

        {/* ── About PORTRAIT hitbox — z:64, invisible, handles drag ─────────── */}
        <div
          className="fixed inset-0 z-[64]"
          style={{
            transform: aboutVisible ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
            willChange: 'transform',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <div
            ref={el => { elRefs.current['aboutPortrait'] = el }}
            className="absolute top-0 left-0 touch-none"
            style={{
              width:        isMobile ? 200 : 340,
              height:       isMobile ? Math.round(200 * 4 / 3) : Math.round(340 * 4 / 3),
              willChange:   'transform',
              cursor:       'none',
              pointerEvents: 'auto',
            }}
            onPointerDown={e => onPointerDown(e, 'aboutPortrait')}
            onPointerUp={onPointerUp}
            onPointerMove={aboutSettled ? onPointerMove : undefined}
            onContextMenu={e => e.preventDefault()}
            role="img"
            aria-label="Portrait of Nadim Kurimbokus"
          />
        </div>

        {/* ── About LOGO hitbox — z:65, invisible, handles drag ────────────── */}
        <div
          className="fixed inset-0 z-[65]"
          style={{
            transform: aboutVisible ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
            willChange: 'transform',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <div
            ref={el => { elRefs.current['aboutLogo'] = el }}
            className="absolute top-0 left-0 touch-none"
            style={{
              width:      isMobile ? 155 : 280,
              height:     isMobile ? 155 : 280,
              willChange: 'transform',
              cursor:     'none',
              pointerEvents: 'auto',
            }}
            onPointerDown={e => onPointerDown(e, 'aboutLogo')}
            onPointerUp={onPointerUp}
            onPointerMove={aboutSettled ? onPointerMove : undefined}
            onContextMenu={e => e.preventDefault()}
            aria-hidden="true"
          />
        </div>

        {/* ── About TEXT layer — z:61, SEPARATE container ──────────────────
            Mix-blend-mode: difference on all text. Opacity hardcoded to 1.
            Contains Zone 1 (name ticker), Zone 3 (static text), Zone 4 (testimonial ticker). */}
        <div
          className="fixed inset-0 z-[61]"
          style={{
            transform: aboutVisible ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
            opacity: 1,
            pointerEvents: 'none',
            willChange: 'transform',
            mixBlendMode: 'difference',
            color: '#ffffff',
          }}
          aria-hidden={!aboutVisible}
        >
          <style>{`@keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } } @media (max-width: 767px) { .about-text-block { top: 55% !important; bottom: 120px !important; } }`}</style>

          {/* Zone 1 — Name ticker, pinned below the "About" / "Close" bar */}
          <div
            ref={(el) => { nameTickerWrapperRef.current = el }}
            style={{ position: 'absolute', top: 68, left: 0, right: 0, height: 'clamp(66px, 11vw, 132px)', zIndex: 63, overflow: 'hidden', whiteSpace: 'nowrap', pointerEvents: 'auto', cursor: 'none' }}
            onMouseDown={e => nameTickerH.start(e.clientX, e.timeStamp)}
            onMouseMove={e => nameTickerH.move(e.clientX, e.timeStamp)}
            onMouseUp={nameTickerH.end}
            onMouseLeave={nameTickerH.end}
          >
            <div
              ref={nameTickerTrackRef}
              style={{ display: 'inline-block', animation: 'tickerScroll 16s linear infinite', fontSize: 'clamp(60px, 10vw, 120px)', lineHeight: 1.1 }}
            >
              {[0, 1, 2, 3].map(i => (
                <span key={i} style={{ display: 'inline-block', paddingRight: '4rem' }}>Nadim Kurimbokus</span>
              ))}
            </div>
          </div>

          {/* Zone 3 — Static text block, desktop only (mobile gets its own scrollable layer) */}
          {!isMobile && (
          <div
            className="about-text-block"
            style={{ position: 'absolute', top: '65%', bottom: '140px', left: 0, right: 0, padding: '0 48px', zIndex: 61, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}
          >
            {/* Row A — centred */}
            <p className="about-bio text-base md:text-xl leading-loose" style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 'clamp(14px, 2.5vw, 20px)' }}>Nadim Kurimbokus is a British-Mauritian photographer based in London. He shoots live music, brand and cultural events for venues, labels, brands and artists across the UK and Europe. His work spans gigs, festivals, club nights, artist portraits and brand campaigns.</span>
            </p>
            {/* Row B — centred */}
            <p className="text-base md:text-xl leading-loose" style={{ textAlign: 'center', marginTop: '2rem' }}>
              <span style={{ fontSize: 'clamp(11px, 1.6vw, 15px)' }}>BBC · Roundhouse · Jazz Cafe · BAPE · Westside Gunn · Teg Live Europe · Lomography · Museum of the Home</span>
            </p>
            {/* Row C — centred */}
            <p className="text-base md:text-xl" style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 'clamp(11px, 1.6vw, 15px)' }}>Available for live coverage, tour and press work, brand campaigns and cultural commissions — UK and Europe.</span>
            </p>
            {/* Row D — centred buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '1rem', pointerEvents: 'auto', marginTop: '1.5rem', position: 'relative', zIndex: 66 }}>
              <a
                href="mailto:Nkurimbokus@gmail.com?subject=Enquiry"
                style={{ pointerEvents: 'auto' }}
                className="px-5 py-3 border border-current text-base tracking-widest lowercase rounded-sm transition-colors focus:outline-none"
              >Email me</a>
              <a
                href="https://www.instagram.com/nadim_kurimbokus/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ pointerEvents: 'auto' }}
                className="px-5 py-3 border border-current text-base tracking-widest lowercase rounded-sm transition-colors focus:outline-none"
              >Instagram</a>
            </div>
          </div>
          )}

          {/* Zone 4 — Testimonial ticker, desktop only */}
          {!isMobile && (
          <div
            ref={(el) => { desktopTickerWrapperRef.current = el }}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden', whiteSpace: 'nowrap', width: '100%', pointerEvents: 'auto', mixBlendMode: 'difference', color: '#ffffff', fontSize: '1.5rem', letterSpacing: '0.02em', paddingTop: 10, paddingBottom: 10, cursor: 'none' }}
            onMouseDown={e => testimonialH.start(e.clientX, e.timeStamp)}
            onMouseMove={e => testimonialH.move(e.clientX, e.timeStamp)}
            onMouseUp={testimonialH.end}
            onMouseLeave={testimonialH.end}
          >
            <div ref={tickerTrackRef} style={{ display: 'inline-block', animation: 'tickerScroll 60s linear infinite' }}>
              {[0, 1].map(i => (
                <span key={i} style={{ display: 'inline-block' }}>
                  <span style={{ display: 'inline-block', paddingRight: '6rem' }}>&ldquo;Nadim was prompt, great to work with, and really understood what pics we were after. He nailed the vibe perfectly, and we absolutely loved the photos.&rdquo; — Alicia Grimshaw, Tamil Prince</span>
                  <span style={{ display: 'inline-block', paddingRight: '6rem' }}>&ldquo;Working with Nadim is an absolute pleasure, he consistently understands the brief and delivers exceptional results for every show. He is incredibly versatile, works seamlessly with artists, and always manages to capture the true, lively energy of the Roundhouse.&rdquo; — Saskia Burrows, Roundhouse</span>
                  <span style={{ display: 'inline-block', paddingRight: '6rem' }}>&ldquo;Nadim has captured wonderful memories at our events for many years, always bringing vibrant energy to our spaces and his images.&rdquo; — Mark Norton, The Photography Foundation</span>
                </span>
              ))}
            </div>
          </div>
          )}
        </div>

        {/* Mobile — scrollable text layer: z:[66], above physics hitboxes (z:[64]/[65]).
            Container: pointer-events:none so touches on empty space reach the physics hitboxes below.
            Text children: pointer-events:auto so touch events on them trigger scroll. */}
        {isMobile && (
          <div
            className="fixed inset-0 z-[66]"
            style={{
              transform: aboutVisible ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
              overflowY: 'scroll',
              background: 'transparent',
              pointerEvents: 'none',
              willChange: 'transform',
              mixBlendMode: 'difference',
              color: '#ffffff',
              opacity: 1,
            }}
            aria-hidden={!aboutVisible}
          >
            {/* Spacer — 40vh pushes text below the physics photos */}
            <div style={{ height: '52vh', pointerEvents: 'none' }} />

            {/* Bio */}
            <p style={{ pointerEvents: 'auto', textAlign: 'center', padding: '0 24px', fontSize: 'clamp(11px, 3vw, 14px)', lineHeight: '1.75', marginBottom: '0.5rem' }}>
              Nadim Kurimbokus is a British-Mauritian photographer based in London. He shoots live music, brand and cultural events for venues, labels, brands and artists across the UK and Europe. His work spans gigs, festivals, club nights, artist portraits and brand campaigns.
            </p>

            {/* Client list */}
            <p style={{ pointerEvents: 'auto', textAlign: 'center', padding: '0 24px', fontSize: 'clamp(10px, 2.5vw, 12px)', lineHeight: '1.75', marginBottom: '0.5rem' }}>
              BBC · Roundhouse · Jazz Cafe · BAPE · Westside Gunn · Teg Live Europe · Lomography · Museum of the Home
            </p>

            {/* Availability */}
            <p style={{ pointerEvents: 'auto', textAlign: 'center', padding: '0 24px', fontSize: 'clamp(10px, 2.5vw, 12px)', lineHeight: '1.5', marginBottom: '0.5rem' }}>
              Available for live coverage, tour and press work, brand campaigns and cultural commissions — UK and Europe.
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '1rem', pointerEvents: 'auto', marginTop: '1rem', marginBottom: '0.5rem', padding: '0 24px' }}>
              <a
                href="mailto:Nkurimbokus@gmail.com?subject=Enquiry"
                style={{ pointerEvents: 'auto', padding: '6px 12px', fontSize: '13px' }}
                className="border border-current tracking-widest lowercase rounded-sm"
              >Email me</a>
              <a
                href="https://www.instagram.com/nadim_kurimbokus/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ pointerEvents: 'auto', padding: '6px 12px', fontSize: '13px' }}
                className="border border-current tracking-widest lowercase rounded-sm"
              >Instagram</a>
            </div>

            {/* Testimonial ticker */}
            <div
              ref={(el) => { mobileTickerWrapperRef.current = el }}
              style={{ pointerEvents: 'auto', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%', mixBlendMode: 'difference', color: '#ffffff', fontSize: '1.5rem', letterSpacing: '0.02em', marginTop: '1rem', paddingTop: 10, paddingBottom: 0, cursor: 'none' }}
              onMouseDown={e => testimonialH.start(e.clientX, e.timeStamp)}
              onMouseMove={e => testimonialH.move(e.clientX, e.timeStamp)}
              onMouseUp={testimonialH.end}
              onMouseLeave={testimonialH.end}
            >
              <div ref={tickerTrackRef} style={{ display: 'inline-block', animation: 'tickerScroll 60s linear infinite' }}>
                {[0, 1].map(i => (
                  <span key={i} style={{ display: 'inline-block' }}>
                    <span style={{ display: 'inline-block', paddingRight: '6rem' }}>&ldquo;Nadim was prompt, great to work with, and really understood what pics we were after. He nailed the vibe perfectly, and we absolutely loved the photos.&rdquo; — Alicia Grimshaw, Tamil Prince</span>
                    <span style={{ display: 'inline-block', paddingRight: '6rem' }}>&ldquo;Working with Nadim is an absolute pleasure, he consistently understands the brief and delivers exceptional results for every show. He is incredibly versatile, works seamlessly with artists, and always manages to capture the true, lively energy of the Roundhouse.&rdquo; — Saskia Burrows, Roundhouse</span>
                    <span style={{ display: 'inline-block', paddingRight: '6rem' }}>&ldquo;Nadim has captured wonderful memories at our events for many years, always bringing vibrant energy to our spaces and his images.&rdquo; — Mark Norton, The Photography Foundation</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        </>

      {/* ─── Photo viewer ───────────────────────────────────────────────── */}
      {activePhoto && (
        <>
          {/* Click-to-close backdrop + light blur on the canvas behind */}
          <div
            className="fixed inset-0 z-[8]"
            style={{
              cursor: 'none',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              opacity: lbVisible ? 1 : 0,
              transition: 'opacity 0.2s ease',
            }}
            onClick={closeLightbox}
          />

          {/* No overlay — the photo just floats above the live canvas.
              Shadow on the photo card gives the sense of elevation.
              Blend is applied per-text-element on the caption nodes below —
              NOT on this root — so the photo stays un-inverted. */}
          <div
            className="fixed inset-0 z-[9] flex flex-col items-center justify-center p-6 gap-4 pointer-events-none"
            style={{ backgroundColor: 'transparent' }}
            role="dialog" aria-modal="true"
            aria-label={`${activePhoto.title} — ${activePhoto.category}`}
          >
            {/* Selected photo — rises from below on open, drifts upward on close */}
            <div
              ref={el => { lbCardRef.current = el }}
              className="relative pointer-events-auto"
              style={{
                aspectRatio: lbAspect,
                width: `min(calc(100vw - 48px), calc(80vh * ${lbRatio.toFixed(6)}))`,
                maxHeight: '80vh',
                opacity: lbVisible ? 1 : 0,
                transform: lbVisible
                  ? 'translate(0px, 0px) scale(1) rotate(0deg)'
                  : `translate(${lbSource.x}px, ${lbSource.y}px) scale(${lbSource.scale}) rotate(${lbSource.rot}deg)`,
                transition: lbVisible
                  ? 'transform 0.36s cubic-bezier(0.16, 1, 0.3, 1), opacity 0s, aspect-ratio 0.34s cubic-bezier(0.16, 1, 0.3, 1), width 0.34s cubic-bezier(0.16, 1, 0.3, 1)'
                  : 'transform 0.26s cubic-bezier(0.55, 0, 1, 0.45), opacity 0s ease 0.22s',
                willChange: 'transform, opacity',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Zoom / pan layer — transform managed entirely via direct DOM */}
              <div
                ref={(el) => { lbZoomLayerRef.current = el }}
                style={{
                  position: 'absolute', inset: 0,
                  cursor: 'none',
                  touchAction: 'none',  // let our touch handlers own all gestures
                  willChange: 'transform',
                }}
                onPointerDown={onLbImageDown}
                onPointerMove={onLbImageMove}
                onPointerUp={onLbImageUp}
                onClick={onLbImageClick}
                onWheel={onLbWheel}
                onTouchStart={onLbTouchStart}
                onTouchMove={onLbTouchMove}
                onTouchEnd={onLbTouchEnd}
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
                    const trans = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
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

            </div>
          </div>

          {/* Gallery nav arrows — fixed viewport, outside all stacking contexts */}
          {activePhoto.gallery.length > 1 && lbZoom === 1 && (
            <>
              <button
                style={{ position: 'fixed', left: 'calc(50% - min(50vw, 50vh * 1.5) - 8px)', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'none', border: 'none', padding: '8px', pointerEvents: 'auto', cursor: 'none' }}
                onClick={e => { e.stopPropagation(); navigate(-1) }}
                aria-label="Previous image"
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ mixBlendMode: 'difference' }}>
                  <polyline points="18 6 10 14 18 22" />
                </svg>
              </button>
              <button
                style={{ position: 'fixed', right: 'calc(50% - min(50vw, 50vh * 1.5) - 8px)', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'none', border: 'none', padding: '8px', pointerEvents: 'auto', cursor: 'none' }}
                onClick={e => { e.stopPropagation(); navigate(1) }}
                aria-label="Next image"
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ mixBlendMode: 'difference' }}>
                  <polyline points="10 6 18 14 10 22" />
                </svg>
              </button>
            </>
          )}

          {/* ── Lightbox CAPTION layer — z:10, SEPARATE container ──────────
              Lives OUTSIDE the lightbox content root. Contains ONLY text
              (title, category•year, counter, zoom hint, close button). Plain
              black text — no blend. The full-screen layer is pointer-events:
              none so clicks fall through to the photo/backdrop below; only
              the inner caption wrapper turns events back on for the close
              button. */}
          <div
            className="fixed inset-0 z-[10] flex flex-col items-end justify-end p-6"
            style={{
              // TEST (A): opacity hardcoded to 1 so the layer never enters a
              // fractional-opacity state that creates a stacking context and
              // traps mix-blend-mode. Show/hide handled by the parent
              // `{activePhoto && ...}` conditional unmount.
              opacity: 1,
              pointerEvents: 'none',
              mixBlendMode: 'difference',
              color: '#ffffff',
            }}
            aria-hidden={!lbVisible}
          >
            <div
              className="relative flex items-center justify-between w-full max-w-2xl mx-auto"
              style={{ pointerEvents: lbVisible ? 'auto' : 'none' }}
              onClick={e => e.stopPropagation()}
            >
              <div>
                <p className="text-sm">{activePhoto.title}</p>
                <p className="text-xs mt-0.5">{activePhoto.category} &bull; {activePhoto.year}</p>
              </div>
              <div className="flex items-center gap-4">
                {activePhoto.gallery.length > 1 && (
                  <span className="text-xs tabular-nums">
                    {galleryIndex + 1} / {activePhoto.gallery.length}
                  </span>
                )}
                {!isMobile && (
                  <span className="text-xs">{lbZoom === 1 ? 'click to zoom' : 'click to fit'}</span>
                )}
                <button
                  className="text-sm tracking-widest lowercase focus:outline-none focus-visible:underline"
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
