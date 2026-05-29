// copy-live-images.js
// Renames and copies 6 live photography shoots from external SSD into the project,
// then appends entries to data/images.json.
// Safe to re-run: skips copies where the destination already exists.

const fs   = require('fs');
const path = require('path');

const SSD_BASE  = 'D:\\nadim portfolio kit\\nadim portfolio working\\candidates\\live';
const DEST_BASE = 'C:\\Users\\nkuri\\nadim-portfolio\\public\\images\\live';
const JSON_PATH = 'C:\\Users\\nkuri\\nadim-portfolio\\data\\images.json';

// size folder name on disk → suffix used in filenames and JSON key
const SIZE_MAP = [
  { folder: 'Large',    suffix: 'large',    jsonKey: 'large'    },
  { folder: 'Standard', suffix: 'standard', jsonKey: 'standard' },
  { folder: 'Thumbs',   suffix: 'thumb',    jsonKey: 'thumbs'   },
];

const SHOOTS = [
  {
    srcFolder:   'southfacing festival for hiphop backin the day 2025',
    baseSlug:    'live_2025_southfacing-festival_hiphop-back-in-the-day',
    title:       'Hiphop Back in the Day · Southfacing Festival',
    client:      'Southfacing Festival',
    year:        '2025',
  },
  {
    srcFolder:   'Sonbyjim for sonnyjim 2025',
    baseSlug:    'live_2025_sonnyjim_sonnyjim',
    title:       'Sonnyjim',
    client:      'Sonnyjim',
    year:        '2025',
  },
  {
    srcFolder:   'School boy q for round house 2025',
    baseSlug:    'live_2025_roundhouse_schoolboy-q',
    title:       'Schoolboy Q · Roundhouse',
    client:      'Roundhouse',
    year:        '2025',
  },
  {
    srcFolder:   'Pharcyde for spread love 2025',
    baseSlug:    'live_2025_spread-love_pharcyde',
    title:       'The Pharcyde · Spread Love',
    client:      'Spread Love',
    year:        '2025',
  },
  {
    srcFolder:   'Jazz cafe festival for Wsg 2025',
    baseSlug:    'live_2025_jazz-cafe_wsg',
    title:       'WSG · Jazz Cafe Festival',
    client:      'Jazz Cafe',
    year:        '2025',
  },
  {
    srcFolder:   'Freddie Gibbs QB_NYC 2025',
    baseSlug:    'live_2025_qb-nyc_freddie-gibbs',
    title:       'Freddie Gibbs · QB NYC',
    client:      'QB NYC',
    year:        '2025',
  },
];

// Derive the subfolder under public/images/live/ from the base slug.
// Pattern: live_YEAR_VENUE_SLUG → strip "live_YEAR_", replace remaining _ with -
function subfolderFromSlug(baseSlug) {
  // drop "live_2025_" prefix, then replace underscores with hyphens
  return baseSlug.replace(/^live_\d{4}_/, '').replace(/_/g, '-');
}

function pad3(n) {
  return String(n).padStart(3, '0');
}

// ── main ─────────────────────────────────────────────────────────────────────

const manifest = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const existingIds = new Set(manifest.projects.map(p => p.id));

let totalCopied = 0;
let totalSkipped = 0;

for (const shoot of SHOOTS) {
  const projectId  = shoot.baseSlug;          // e.g. live_2025_roundhouse_schoolboy-q
  const subfolder  = subfolderFromSlug(shoot.baseSlug);
  const destDir    = path.join(DEST_BASE, subfolder);
  const srcDir     = path.join(SSD_BASE, shoot.srcFolder);

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`SHOOT : ${shoot.title}`);
  console.log(`SRC   : ${srcDir}`);
  console.log(`DEST  : ${destDir}`);

  fs.mkdirSync(destDir, { recursive: true });

  // Collect file counts per size so we can build the images array
  // images array will have one entry per unique sequence number
  const fileCountPerSize = {};

  for (const size of SIZE_MAP) {
    const sizeDir = path.join(srcDir, size.folder);
    if (!fs.existsSync(sizeDir)) {
      console.warn(`  [WARN] Missing size folder: ${sizeDir}`);
      fileCountPerSize[size.jsonKey] = 0;
      continue;
    }

    const files = fs.readdirSync(sizeDir)
      .filter(f => /\.(jpg|jpeg)$/i.test(f))
      .sort();   // lexicographic sort; works for img001, img002 etc.

    fileCountPerSize[size.jsonKey] = files.length;

    for (let i = 0; i < files.length; i++) {
      const seq      = pad3(i + 1);
      const destName = `${shoot.baseSlug}_${seq}_${size.suffix}.jpg`;
      const srcFile  = path.join(sizeDir, files[i]);
      const destFile = path.join(destDir, destName);

      if (fs.existsSync(destFile)) {
        console.log(`  [SKIP] ${destName}  (already exists)`);
        totalSkipped++;
      } else {
        fs.copyFileSync(srcFile, destFile);
        console.log(`  [COPY] ${files[i]}  →  ${destName}`);
        totalCopied++;
      }
    }
  }

  // ── images.json ────────────────────────────────────────────────────────────
  if (existingIds.has(projectId)) {
    console.log(`  [JSON] Project "${projectId}" already in images.json — skipping`);
    continue;
  }

  // Number of images is the standard-size count (all sizes match)
  const count = fileCountPerSize['standard'] || fileCountPerSize['large'] || 0;

  const imageEntries = [];
  for (let i = 1; i <= count; i++) {
    const seq = pad3(i);
    const id  = `${shoot.baseSlug}_${seq}`;
    imageEntries.push({
      id,
      src: {
        large:    `/images/live/${subfolder}/${shoot.baseSlug}_${seq}_large.jpg`,
        standard: `/images/live/${subfolder}/${shoot.baseSlug}_${seq}_standard.jpg`,
        thumbs:   `/images/live/${subfolder}/${shoot.baseSlug}_${seq}_thumb.jpg`,
      },
      alt:      '',
      featured: false,
    });
  }

  const projectEntry = {
    id:            projectId,
    title:         shoot.title,
    category:      'live',
    year:          shoot.year,
    client:        shoot.client,
    slug:          `${subfolder}-${shoot.year}`,
    featuredImage: `${shoot.baseSlug}_001`,
    images:        imageEntries,
  };

  manifest.projects.push(projectEntry);
  existingIds.add(projectId);
  console.log(`  [JSON] Added project "${projectId}" with ${count} images`);
}

fs.writeFileSync(JSON_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`\n${'═'.repeat(70)}`);
console.log(`Done.  Copied: ${totalCopied}  |  Skipped (already existed): ${totalSkipped}`);
console.log(`images.json updated → ${JSON_PATH}`);
