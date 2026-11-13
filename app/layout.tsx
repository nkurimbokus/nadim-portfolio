import type { Metadata, Viewport } from 'next'
import { Archivo_Black } from 'next/font/google'
import './globals.css'
import CursorDot from '../components/CursorDot'

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

const SITE_URL = 'https://nadimkurimbokus.com'
const TITLE = 'Nadim Kurimbokus · Event & Music Photographer, London'
const DESCRIPTION =
  'London photographer for live events, music, tours and press. Work for Roundhouse, Jazz Cafe and Westside Gunn. Available across the UK and Europe.'

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: '%s · Nadim Kurimbokus',
  },
  description: DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'Nadim Kurimbokus',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Nadim Kurimbokus · Event & Music Photographer',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

// ─── Structured data (JSON-LD) ────────────────────────────────────────────────
// Tells search engines who the site is about. Facts here mirror the About text.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Nadim Kurimbokus',
      inLanguage: 'en-GB',
      publisher: { '@id': `${SITE_URL}/#person` },
    },
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/#person`,
      name: 'Nadim Kurimbokus',
      jobTitle: 'Photographer',
      description: DESCRIPTION,
      url: SITE_URL,
      image: `${SITE_URL}/og-image.jpg`,
      email: 'mailto:nkurimbokus@gmail.com',
      homeLocation: { '@type': 'Place', name: 'London, United Kingdom' },
      knowsAbout: ['Event photography', 'Live music photography', 'Festival photography', 'Artist portraits', 'Brand campaign photography'],
      sameAs: ['https://www.instagram.com/nadim_kurimbokus/'],
    },
  ],
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
      style={{ cursor: 'none' }}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
  @media (pointer: fine) {
    *, *::before, *::after {
      cursor: none !important;
    }
  }
` }} />
      </head>
      <body className="bg-bg-default text-fg-default antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        <CursorDot />
        {children}
      </body>
    </html>
  )
}
