import Image from 'next/image'
import Link from 'next/link'

export const metadata = {
  title: 'Jazz Cafe Festival — Live — 2024',
}

export default function JazzCafeFestival2024() {
  return (
    <main className="min-h-screen bg-bg-default text-fg-default px-6 py-16 max-w-4xl mx-auto">
      <Link
        href="/"
        className="text-xs tracking-widest uppercase text-fg-muted hover:text-fg-default transition-colors"
      >
        ← Back
      </Link>

      <div className="mt-12">
        <p className="text-xs tracking-widest uppercase text-accent font-display mb-2">Live · 2024</p>
        <h1 className="text-4xl font-display tracking-wide mb-10">Jazz Cafe Festival</h1>

        <div className="relative w-full aspect-[1600/1113] max-w-2xl">
          <Image
            src="/images/live/jazzcafe-festival/live_2024_jazzcafe-festival_001_large.jpg"
            fill
            alt="Jazz Cafe Festival — Live 2024"
            className="object-cover"
            priority
            unoptimized
          />
        </div>
      </div>
    </main>
  )
}
