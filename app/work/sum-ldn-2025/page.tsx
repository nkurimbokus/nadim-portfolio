import Image from 'next/image'
import Link from 'next/link'

export const metadata = {
  title: 'Sum Ldn — Brand — 2025',
}

export default function SumLdn2025() {
  return (
    <main className="min-h-screen bg-bg-default text-fg-default px-6 py-16 max-w-4xl mx-auto">
      <Link
        href="/"
        className="text-xs tracking-widest uppercase text-fg-muted hover:text-fg-default transition-colors"
      >
        ← Back
      </Link>

      <div className="mt-12">
        <p className="text-xs tracking-widest uppercase text-accent-blue font-display mb-2">Brand · 2025</p>
        <h1 className="text-4xl font-display tracking-wide mb-10">Sum Ldn</h1>

        <div className="relative w-full aspect-[1060/1600] max-w-sm">
          <Image
            src="/images/brand/sum-ldn/brand_2025_sum-ldn_fashion-shoot_001_large.jpg"
            fill
            alt="Sum Ldn — Brand 2025"
            className="object-cover"
            priority
            unoptimized
          />
        </div>
      </div>
    </main>
  )
}
