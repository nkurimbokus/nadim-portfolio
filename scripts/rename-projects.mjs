import fs from 'fs'
import path from 'path'

const PUBLIC = 'C:\\Users\\nkuri\\nadim-portfolio\\public\\images'
const PAGE   = 'C:\\Users\\nkuri\\nadim-portfolio\\app\\page.tsx'
const JSON_  = 'C:\\Users\\nkuri\\nadim-portfolio\\data\\images.json'

// [oldFolder, oldFilePrefix, newFolder, newFilePrefix]
const RENAMES = [
  [
    'brand/sum-ldn',
    'brand_2025_sum-ldn_fashion-shoot_',
    'brand/sum-london',
    'brand_2025_sum-london_fashion-shoot_',
  ],
  [
    'live/sonnyjim-sonnyjim',
    'live_2025_sonnyjim_sonnyjim_',
    'live/sonnyjim-hootananny-brixton',
    'live_2025_sonnyjim-hootananny-brixton_',
  ],
  [
    'live/spread-love-pharcyde',
    'live_2025_spread-love_pharcyde_',
    'live/pharcyde-o2-kentish-town',
    'live_2025_pharcyde-o2-kentish-town_',
  ],
  [
    'live/jazz-cafe-wsg',
    'live_2025_jazz-cafe_wsg_',
    'live/westside-gunn-jazz-cafe',
    'live_2025_westside-gunn-jazz-cafe_',
  ],
  [
    'live/qb-nyc-freddie-gibbs',
    'live_2025_qb-nyc_freddie-gibbs_',
    'live/freddie-gibbs-o2-brixton',
    'live_2026_freddie-gibbs-o2-brixton_',
  ],
]

// 1 — Rename files inside each folder, then rename the folder
for (const [oldDir, oldPrefix, newDir, newPrefix] of RENAMES) {
  const oldPath = path.join(PUBLIC, oldDir)
  const newPath = path.join(PUBLIC, newDir)

  if (!fs.existsSync(oldPath)) {
    console.log(`SKIP (not found): ${oldPath}`)
    continue
  }

  // Rename files inside first
  const files = fs.readdirSync(oldPath)
  for (const file of files) {
    if (file.startsWith(oldPrefix)) {
      const newFile = newPrefix + file.slice(oldPrefix.length)
      fs.renameSync(path.join(oldPath, file), path.join(oldPath, newFile))
      console.log(`  ${file} → ${newFile}`)
    }
  }

  // Rename folder
  fs.renameSync(oldPath, newPath)
  console.log(`FOLDER: ${oldDir} → ${newDir}\n`)
}

// 2 — Update page.tsx (replace both dims map keys and gallery paths)
let page = fs.readFileSync(PAGE, 'utf8')
for (const [oldDir, oldPrefix, newDir, newPrefix] of RENAMES) {
  const oldUrlBase = `/images/${oldDir}/${oldPrefix}`
  const newUrlBase = `/images/${newDir}/${newPrefix}`
  page = page.replaceAll(oldUrlBase, newUrlBase)
}
fs.writeFileSync(PAGE, page, 'utf8')
console.log('page.tsx updated')

// 3 — Update images.json
let json = fs.readFileSync(JSON_, 'utf8')
for (const [oldDir, oldPrefix, newDir, newPrefix] of RENAMES) {
  json = json.replaceAll(`/images/${oldDir}/${oldPrefix}`, `/images/${newDir}/${newPrefix}`)
  json = json.replaceAll(`"${oldDir.split('/')[1]}"`, `"${newDir.split('/')[1]}"`) // slug field if present
}
fs.writeFileSync(JSON_, json, 'utf8')
console.log('images.json updated')
