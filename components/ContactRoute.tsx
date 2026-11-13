'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ContactBody from './ContactBody'
import ContactHeader from './ContactHeader'

// The /contact route (direct visits and shared links). Slides up on arrival and slides
// down on close, matching the Work and About panels on the home page.
export default function ContactRoute() {
  const router = useRouter()
  const [closing, setClosing] = useState(false)

  function close() {
    if (closing) return
    setClosing(true)
    setTimeout(() => router.push('/'), 320)
  }

  return (
    <div
      className="min-h-screen bg-bg-default text-fg-default contact-slide-in"
      style={{
        transform: closing ? 'translateY(100%)' : undefined,
        transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
        willChange: 'transform',
      }}
    >
      <ContactHeader onClose={close} />
      <ContactBody />
    </div>
  )
}
