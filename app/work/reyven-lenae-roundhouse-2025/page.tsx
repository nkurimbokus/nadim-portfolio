import Image from 'next/image'
import Link from 'next/link'

export const metadata = {
  title: 'Reyven Lenae · Roundhouse — Live — 2025',
}

export default function ReyvenLenaeRoundhouse2025() {
  return (
    <main className="min-h-screen bg-bg-default text-fg-default px-6 py-16 max-w-4xl mx-auto">
      <Link
        href="/"
        className="text-xs tracking-widest uppercase text-fg-muted hover:text-fg-default transition-colors"
      >
        ← Back
      </Link>

      <div className="mt-12">
        <p className="text-xs tracking-widest uppercase text-accent font-display mb-2">Live · 2025</p>
        <h1 className="text-4xl font-display tracking-wide mb-10">Reyven Lenae · Roundhouse</h1>

        <div className="relative w-full aspect-[1067/1600] max-w-sm">
          <Image
            src="/images/live/reyven-lenae-roundhouse/live_2025_reyven-lenae-roundhouse_001_large.jpg"
            fill
            alt="Reyven Lenae · Roundhouse — Live 2025"
            className="object-cover"
            priority
            unoptimized
          />
        </div>
      </div>
    </main>
  )
}
