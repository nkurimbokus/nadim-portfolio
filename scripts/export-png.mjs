import sharp from 'sharp'
import path from 'path'

const SRC    = 'D:\\nadim portfolio kit\\nadim portfolio working\\candidates\\live\\Freddie Gibbs QB_NYC 2025\\Large'
const DEST   = 'C:\\Users\\nkuri\\nadim-portfolio\\public\\images\\live\\qb-nyc-freddie-gibbs'
const PREFIX = 'live_2025_qb-nyc_freddie-gibbs'

const files = [
  { src: 'img509-3.png', num: '013' },
  { src: 'img511-3.png', num: '014' },
]
const SIZES = [
  { suffix: 'large',    px: 2400 },
  { suffix: 'standard', px: 1600 },
  { suffix: 'thumb',    px: 800  },
]

for (const { src, num } of files) {
  const srcPath = path.join(SRC, src)
  const meta = await sharp(srcPath).metadata()
  const isLandscape = (meta.width ?? 0) >= (meta.height ?? 0)
  for (const { suffix, px } of SIZES) {
    const outName = `${PREFIX}_${num}_${suffix}.png`
    const outPath = path.join(DEST, outName)
    const resizeOpts = isLandscape ? { width: px } : { height: px }
    await sharp(srcPath).resize(resizeOpts).png({ compressionLevel: 8 }).toFile(outPath)
    const m = await sharp(outPath).metadata()
    console.log(`[${num}] ${suffix.padEnd(8)} ${m.width}x${m.height} → ${outName}`)
  }
}
