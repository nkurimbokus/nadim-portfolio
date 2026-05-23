'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

// ─── Nav links ────────────────────────────────────────────────────────────────
// Three links only per brand brief — no category links in the nav.

const NAV_LINKS = [
  { label: 'Work',    href: '/' },
  { label: 'About',   href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const

// ─── Hamburger / close icon ───────────────────────────────────────────────────

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <line x1="2" y1="6"  x2="20" y2="6"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        style={{ transform: open ? 'translateY(5px) rotate(45deg)' : 'none', transformOrigin: 'center', transition: 'transform 0.2s ease' }} />
      <line x1="2" y1="11" x2="20" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        style={{ opacity: open ? 0 : 1, transition: 'opacity 0.15s ease' }} />
      <line x1="2" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        style={{ transform: open ? 'translateY(-5px) rotate(-45deg)' : 'none', transformOrigin: 'center', transition: 'transform 0.2s ease' }} />
    </svg>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onResize = (e: MediaQueryListEvent) => { if (e.matches) setMenuOpen(false) }
    mq.addEventListener('change', onResize)
    return () => mq.removeEventListener('change', onResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <header className="sticky top-0 z-40 bg-bg-default">
        <div className="mx-auto max-w-screen-xl px-6 md:px-10 h-16 flex items-center justify-between">

          {/* Logo — TODO: replace with fridge-magnet PNG once exported */}
          <Link href="/" aria-label="Nadim Kurimbokus — return to home" className="group focus-visible:outline-none">
            <span className="font-display font-semibold text-fg-default text-sm tracking-[0.22em] uppercase group-focus-visible:text-accent transition-colors duration-150">
              Nadim Kurimbokus
            </span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Main navigation" className="hidden md:block">
            <ul className="flex items-center gap-8" role="list">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="font-display font-medium text-fg-muted text-xs tracking-[0.18em] uppercase hover:text-fg-default transition-colors duration-150 focus-visible:outline-none focus-visible:text-accent">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Hamburger — mobile only (brand brief: no hamburger on desktop) */}
          <button type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="mobile-menu"
            onClick={() => setMenuOpen(v => !v)}
            className="md:hidden relative z-[60] text-fg-default p-1 -mr-1 focus-visible:outline-none focus-visible:text-accent transition-colors duration-150">
            <MenuIcon open={menuOpen} />
          </button>

        </div>
      </header>

      {/* Mobile overlay */}
      <nav id="mobile-menu" aria-label="Mobile navigation" aria-hidden={!menuOpen}
        className={['md:hidden fixed inset-0 z-50', 'bg-bg-default', 'flex flex-col items-center justify-center', 'transition-opacity duration-200',
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'].join(' ')}>
        <ul className="flex flex-col items-center gap-10" role="list">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <Link href={href} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}
                className="font-display font-semibold text-fg-default text-3xl tracking-[0.18em] uppercase hover:text-accent transition-colors duration-150 focus-visible:outline-none focus-visible:text-accent">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
