import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import ContactForm from '../../components/ContactForm'
import ContactNav from '../../components/ContactNav'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Book Nadim Kurimbokus for live music, brand and cultural photography in London, the UK and Europe.',
  alternates: { canonical: '/contact' },
}

// ─── Copy ─────────────────────────────────────────────────────────────────────
// Kept at the top so it is easy to swap.
const INTRO =
  'Booking a shoot, or got a question? Tell me what it is, when and where, and I will reply by email.'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-bg-default text-fg-default">

      {/* Header: logo left, nav right, same lowercase tracked style as the home page. */}
      <header className="flex items-center justify-between px-6 md:px-10 h-16">
        <Link href="/" aria-label="Nadim Kurimbokus, back to home" className="no-blend block focus:outline-none focus-visible:opacity-70">
          <Image src="/logo.webp" alt="Nadim Kurimbokus" width={1200} height={476} unoptimized priority className="h-9 md:h-10 w-auto" />
        </Link>
        <ContactNav />
      </header>

      <main className="mx-auto w-full max-w-xl px-6 md:px-0 pt-10 md:pt-16 pb-24">
        <h1 className="text-3xl md:text-5xl tracking-widest lowercase">Contact</h1>
        <p className="mt-6 mb-10 text-sm md:text-base tracking-wide leading-relaxed">{INTRO}</p>

        <ContactForm />

        <div className="mt-16 flex flex-wrap items-center gap-4">
          <a
            href="mailto:nkurimbokus@gmail.com"
            className="px-5 py-3 border border-current rounded-sm text-sm md:text-base tracking-widest lowercase transition-colors hover:text-accent-blue focus:outline-none focus-visible:underline"
          >
            nkurimbokus@gmail.com
          </a>
          <a
            href="https://www.instagram.com/nadim_kurimbokus/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 border border-current rounded-sm text-sm md:text-base tracking-widest lowercase transition-colors hover:text-accent-blue focus:outline-none focus-visible:underline"
          >
            Instagram
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </main>

    </div>
  )
}
