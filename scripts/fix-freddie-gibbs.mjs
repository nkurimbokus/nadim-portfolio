import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const SRC_LARGE = 'D:\\nadim portfolio kit\\nadim portfolio working\\candidates\\live\\Freddie Gibbs QB_NYC 2025\\Large'
const DEST      = 'C:\\Users\\nkuri\\nadim-portfolio\\public\\images\\live\\qb-nyc-freddie-gibbs'
const PREFIX    = 'live_2025_qb-nyc_freddie-gibbs'
const WHITE     = { r: 255, g: 255, b: 255 }

const SIZES = [
  { suffix: 'large',    px: 2400 },
  { suffix: 'standard', px: 1600 },
  { suffix: 'thumb',    px: 800  },
]

// Re-export only the PNG sources with white background
const pngSources = fs.readdirSync(SRC_LARGE)
  .filter(f => /\.png$/i.test(f))
  .sort()

const allSources = fs.readdirSync(SRC_LARGE)
  .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
  .sort()

// Map each source to its 001-padded number
const sourceIndex = Object.fromEntries(allSources.map((f, i) => [f, i + 1]))

console.log('Re-exporting PNGs with white background:')
for (const src of pngSources) {
  const num     = String(sourceIndex[src]).padStart(3, '0')
  const srcPath = path.join(SRC_LARGE, src)
  const meta    = await sharp(srcPath).metadata()
  const isLandscape = (meta.width ?? 0) >= (meta.height ?? 0)

  for (const { suffix, px } of SIZES) {
    const outName = `${PREFIX}_${num}_${suffix}.jpg`
    const outPath = path.join(DEST, outName)
    const resizeOpts = isLandscape ? { width: px } : { height: px }

    await sharp(srcPath)
      .flatten({ background: WHITE })
      .resize(resizeOpts)
      .jpeg({ quality: 80, progressive: true })
      .toFile(outPath)

    console.log(`  [${num}] ${suffix} → ${outName}`)
  }
}

// Measure all 14 standard images
console.log('\nMeasuring dimensions of all standard images:')
const dims = {}
for (let i = 0; i < allSources.length; i++) {
  const num      = String(i + 1).padStart(3, '0')
  const stdPath  = path.join(DEST, `${PREFIX}_${num}_standard.jpg`)
  const meta     = await sharp(stdPath).metadata()
  const dimStr   = `${meta.width}/${meta.height}`
  dims[`/images/live/qb-nyc-freddie-gibbs/${PREFIX}_${num}_standard.jpg`] = dimStr
  console.log(`  [${num}] ${dimStr}`)
}

// Emit dims as a JS snippet for easy copy-paste into page.tsx
const snippet = Object.entries(dims)
  .map(([k, v]) => `  '${k}': '${v}',`)
  .join('\n')

fs.writeFileSync(
  'C:\\Users\\nkuri\\nadim-portfolio\\scripts\\freddie-gibbs-dims.txt',
  snippet,
  'utf8'
)
console.log('\nDims snippet written to scripts/freddie-gibbs-dims.txt')
console.log('\n--- SNIPPET ---\n' + snippet + '\n---------------')
