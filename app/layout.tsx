import type { Metadata, Viewport } from 'next'
import { Archivo_Black } from 'next/font/google'
import './globals.css'

// ─── Font ─────────────────────────────────────────────────────────────────────
// Archivo Black, weight 400 (the only weight it ships) — applied to <html> via
// archivo.className so every element inherits it.
const archivo = Archivo_Black({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})

// ─── Viewport ─────────────────────────────────────────────────────────────────
// maximum-scale=1 / user-scalable=no prevents the browser from auto-zooming
// the page when a tap occurs near a small element on mobile.
// The lightbox's custom pinch/double-tap zoom is unaffected — it uses
// touch-action: none on the zoom layer and handles all gestures in JS.

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

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
      className={archivo.className}
    >
      <body className="bg-bg-default text-fg-default antialiased">
        {children}
      </body>
    </html>
  )
}
