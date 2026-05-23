import type { Metadata } from 'next'
import { Barlow_Condensed, Space_Grotesk } from 'next/font/google'
import './globals.css'

// ─── Fonts ────────────────────────────────────────────────────────────────────
// CSS variables picked up by @theme in globals.css:
//   --font-display: var(--font-barlow) — Barlow Condensed, nav/headings/labels
//   --font-body:    var(--font-space)  — Space Grotesk, bio/captions/meta
//
// These are starting points per the brand brief. Typography is decided once
// tested against real images — swap here and in globals.css to try alternatives.

const barlow = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-barlow',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-space',
  display: 'swap',
})

// ─── Site-wide metadata ───────────────────────────────────────────────────────
// Per-page overrides: export a `metadata` const from each route file.

export const metadata: Metadata = {
  title: {
    default: 'Nadim Kurimbokus — Music & Event Photographer, London',
    template: '%s — Nadim Kurimbokus',
  },
  description:
    'London-based music and event photographer Nadim Kurimbokus. Live music, festivals, portraits and cultural commissions for the BBC, BAPE, Jazz Cafe and more.',
  metadataBase: new URL('https://nadimkurimbokus.com'),
  openGraph: {
    title: 'Nadim Kurimbokus — Music & Event Photographer, London',
    description:
      'London-based music and event photographer Nadim Kurimbokus. Live music, festivals, portraits and cultural commissions for the BBC, BAPE, Jazz Cafe and more.',
    url: 'https://nadimkurimbokus.com',
    siteName: 'Nadim Kurimbokus',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Nadim Kurimbokus — Music & Event Photographer',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nadim Kurimbokus — Music & Event Photographer, London',
    description:
      'London-based music and event photographer Nadim Kurimbokus. Live music, festivals, portraits and cultural commissions for the BBC, BAPE, Jazz Cafe and more.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

// ─── Root layout ──────────────────────────────────────────────────────────────
// Header and Footer are NOT in the root layout — the homepage manages its own
// chrome (full-screen surface with its own nav). Standard pages (About, Contact)
// will get Header/Footer via app/(site)/layout.tsx when built.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${spaceGrotesk.variable}`}
    >
      <body className="bg-bg-default text-fg-default antialiased">
        {children}
      </body>
    </html>
  )
}
