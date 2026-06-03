'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function CursorDot() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
    document.body.style.cursor = 'none'
    document.documentElement.style.cursor = 'none'
  }, [])

  useEffect(() => {
    if (!ready) return
    const c = ref.current; if (!c) return
    const onMove = (e: MouseEvent) => {
      c.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`
      c.style.opacity = '1'
      const isInteractive = !!(e.target as HTMLElement).closest('button, a, [role="button"]')
      c.style.width = isInteractive ? '25px' : '18px'
      c.style.height = isInteractive ? '25px' : '18px'
    }
    const onLeave = () => { c.style.opacity = '0' }
    const onEnter = () => { c.style.opacity = '1' }
    window.addEventListener('mousemove', onMove)
    document.documentElement.addEventListener('mouseleave', onLeave)
    document.documentElement.addEventListener('mouseenter', onEnter)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.documentElement.removeEventListener('mouseenter', onEnter)
    }
  }, [ready])

  if (!ready) return null

  return createPortal(
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: '#ffffff',
        mixBlendMode: 'difference',
        zIndex: 99999,
        pointerEvents: 'none',
        opacity: 0,
        transition: 'width 0.15s ease, height 0.15s ease',
      }}
    />,
    document.body
  )
}
