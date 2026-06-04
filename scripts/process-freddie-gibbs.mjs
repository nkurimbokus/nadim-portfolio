import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const SRC   = 'D:\\nadim portfolio kit\\nadim portfolio working\\candidates\\live\\Freddie Gibbs QB_NYC 2025\\Large'
const DEST  = 'C:\\Users\\nkuri\\nadim-portfolio\\public\\images\\live\\qb-nyc-freddie-gibbs'
const PREFIX = 'live_2025_qb-nyc_freddie-gibbs'

const SIZES = [
  { suffix: 'large',    px: 2400 },
  { suffix: 'standard', px: 1600 },
  { suffix: 'thumb',    px: 800  },
]

const sources = fs.readdirSync(SRC)
  .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
  .sort()

console.log(`Found ${sources.length} source files:`)
sources.forEach(f => console.log('  ' + f))
console.log()

fs.mkdirSync(DEST, { recursive: true })

for (let i = 0; i < sources.length; i++) {
  const num     = String(i + 1).padStart(3, '0')
  const srcPath = path.join(SRC, sources[i])
  const meta    = await sharp(srcPath).metadata()
  const isLandscape = (meta.width ?? 0) >= (meta.height ?? 0)

  for (const { suffix, px } of SIZES) {
    const outName = `${PREFIX}_${num}_${suffix}.jpg`
    const outPath = path.join(DEST, outName)

    const resizeOpts = isLandscape
      ? { width: px }
      : { height: px }

    await sharp(srcPath)
      .resize(resizeOpts)
      .jpeg({ quality: 80, progressive: true })
      .toFile(outPath)

    console.log(`[${num}] ${suffix.padEnd(8)} → ${outName}`)
  }
}

// --- Update images.json ---
const DATA_PATH = 'C:\\Users\\nkuri\\nadim-portfolio\\data\\images.json'
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

const newImages = sources.map((_, i) => {
  const num = String(i + 1).padStart(3, '0')
  const id  = `${PREFIX}_${num}`
  return {
    id,
    src: {
      large:    `/images/live/qb-nyc-freddie-gibbs/${id}_large.jpg`,
      standard: `/images/live/qb-nyc-freddie-gibbs/${id}_standard.jpg`,
      thumbs:   `/images/live/qb-nyc-freddie-gibbs/${id}_thumb.jpg`,
    },
    alt: 'Freddie Gibbs performing at QB NYC, 2025.',
    featured: false,
  }
})

const proj = data.projects.find(p => p.id === 'live_2025_qb-nyc_freddie-gibbs')
if (!proj) {
  console.error('ERROR: could not find live_2025_qb-nyc_freddie-gibbs in images.json')
  process.exit(1)
}

proj.images = newImages
proj.featuredImage = `${PREFIX}_001`

fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8')
console.log(`\nimages.json updated — ${newImages.length} images in Freddie Gibbs project.`)
