'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

// Contact page nav. Desktop: inline lowercase links. Phone: hamburger that opens a
// full-screen list, matching the home page menu.
export default function ContactNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const link =
    'flex items-center min-h-[44px] text-base tracking-widest lowercase focus:outline-none focus-visible:underline'

  return (
    <>
      <nav aria-label="Primary navigation" className="hidden md:flex gap-6">
        <Link href="/" className={link + ' opacity-60 hover:opacity-100 transition-opacity duration-200'}>Work</Link>
        <span aria-current="page" className={link}>Contact</span>
      </nav>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="md:hidden flex items-center justify-center min-h-[44px] min-w-[44px] bg-transparent focus:outline-none"
      >
        <svg width="22" height="15" viewBox="0 0 22 15" fill="none" aria-hidden="true">
          <rect width="22" height="2" rx="1" fill="currentColor" />
          <rect y="6.5" width="22" height="2" rx="1" fill="currentColor" />
          <rect y="13" width="22" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-10"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <Link href="/" onClick={() => setOpen(false)} className="text-4xl tracking-widest lowercase min-h-[56px] flex items-center focus:outline-none focus-visible:underline">Work</Link>
          <button type="button" onClick={() => setOpen(false)} className="text-4xl tracking-widest lowercase min-h-[56px] flex items-center focus:outline-none focus-visible:underline">Contact</button>
          <button type="button" onClick={() => setOpen(false)} className="mt-6 text-sm tracking-widest lowercase min-h-[44px] flex items-center focus:outline-none focus-visible:underline">Close</button>
        </div>
      )}
    </>
  )
}
