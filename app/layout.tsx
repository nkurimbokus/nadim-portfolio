import type { Metadata } from 'next'
import { Geist, Archivo_Black } from 'next/font/google'
import './globals.css'

// ─── Font ─────────────────────────────────────────────────────────────────────
// Geist, regular weight (400) only — applied to <html> via geist.className so it
// sets font-family directly and every element inherits it. No Geist Mono, no
// bold/semibold weights loaded → the whole site renders at 400.
const geist = Geist({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

// Archivo Black — display font for work index titles only.
// Exposed as a CSS variable so the client-component page.tsx can reference it
// without importing next/font directly (which is server-only).
const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-archivo-black',
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
      className={`${geist.className} ${archivoBlack.variable}`}
    >
      <body className="bg-bg-default text-fg-default antialiased">
        {children}
      </body>
    </html>
  )
}
