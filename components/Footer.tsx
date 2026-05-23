import Link from 'next/link'

// ─── Nav links ────────────────────────────────────────────────────────────────
// Footer nav mirrors the header — an accessibility convenience for users
// who reach the bottom before deciding where to navigate next.

const NAV_LINKS = [
  { label: 'Live',       href: '/live' },
  { label: 'Editorial',  href: '/editorial' },
  { label: 'Brand',      href: '/brand' },
  { label: 'Cultural',   href: '/cultural' },
  { label: 'About',      href: '/about' },
  { label: 'Contact',    href: '/contact' },
] as const

// ─── Footer ───────────────────────────────────────────────────────────────────
// Three-column layout from /docs/06_COPY_BANK.md.
// Stacks to a single column on mobile (below sm breakpoint).

export default function Footer() {
  return (
    <footer aria-label="Site footer">

      {/* Main body ──────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-screen-xl px-6 md:px-10 pt-16 pb-10">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">

          {/* Left — identity */}
          <div>
            <p className="font-display font-semibold text-fg-default text-sm tracking-[0.18em] uppercase">
              Nadim Kurimbokus
            </p>
            <p className="mt-2 font-body text-fg-muted text-sm">
              Photographer, London
            </p>
          </div>

          {/* Middle — nav */}
          <nav aria-label="Footer navigation">
            <ul className="flex flex-col gap-3" role="list">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-display font-medium text-fg-muted text-xs tracking-[0.18em] uppercase hover:text-fg-default transition-colors duration-150 focus-visible:outline-none focus-visible:text-accent"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right — contact */}
          <div className="flex flex-col gap-3">
            <a
              href="mailto:nkurimbokus@gmail.com"
              className="font-body text-fg-muted text-sm hover:text-fg-default transition-colors duration-150 focus-visible:outline-none focus-visible:text-accent"
            >
              nkurimbokus@gmail.com
            </a>
            <a
              href="https://www.instagram.com/nadim_kurimbokus/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-fg-muted text-sm hover:text-fg-default transition-colors duration-150 focus-visible:outline-none focus-visible:text-accent"
            >
              @nadim_kurimbokus
              <span className="sr-only"> (opens Instagram in a new tab)</span>
            </a>
          </div>

        </div>
      </div>

      {/* Copyright strip ─────────────────────────────────────────────────────── */}
      {/* No border — brand brief says no grey borders or dividers. */}
      <div className="mx-auto max-w-screen-xl px-6 md:px-10 pb-8">
        <p className="font-body text-fg-muted/60 text-xs">
          © Nadim Kurimbokus 2026. All images shown are the photographer&apos;s work
          and remain his copyright.
        </p>
      </div>

    </footer>
  )
}
