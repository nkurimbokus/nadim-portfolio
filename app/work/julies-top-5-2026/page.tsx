import Image from 'next/image'
import Link from 'next/link'

export const metadata = {
  title: 'Julies Top 5 · Roundhouse — Live — 2026',
}

export default function JuliesTop5_2026() {
  return (
    <main className="min-h-screen bg-bg-default text-fg-default px-6 py-16 max-w-4xl mx-auto">
      <Link
        href="/"
        className="text-xs tracking-widest uppercase text-fg-muted hover:text-fg-default transition-colors"
      >
        ← Back
      </Link>

      <div className="mt-12">
        <p className="text-xs tracking-widest uppercase text-accent font-display mb-2">Live · 2026</p>
        <h1 className="text-4xl font-display tracking-wide mb-10">Julies Top 5 · Roundhouse</h1>

        <div className="relative w-full aspect-[1600/1067] max-w-2xl">
          <Image
            src="/images/live/julies-top-5/live_2026_julies-top-5_001_large.jpg"
            fill
            alt="Julies Top 5 — Live 2026"
            className="object-cover"
            priority
            unoptimized
          />
        </div>
      </div>
    </main>
  )
}
