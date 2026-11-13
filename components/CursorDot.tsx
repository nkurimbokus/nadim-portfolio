'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function CursorDot() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (window.innerWidth < 768) return
    setReady(true)
    document.body.style.cursor = 'none'
    document.documentElement.style.cursor = 'none'
  }, [])

  useEffect(() => {
    if (!ready) return
    const c = ref.current; if (!c) return
    // Follow a real mouse only. A finger or pen on a touchscreen laptop also fires mouse events,
    // which would leave the dot sitting where you tapped.
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') { c.style.opacity = '0'; return }
      c.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`
      c.style.opacity = '1'
      const isInteractive = !!(e.target as HTMLElement).closest('button, a, [role="button"]')
      c.style.width = isInteractive ? '25px' : '18px'
      c.style.height = isInteractive ? '25px' : '18px'
    }
    const onLeave = () => { c.style.opacity = '0' }
    const onEnter = () => {}   // the dot reappears on the next real mouse move
    const onDown = (e: PointerEvent) => { if (e.pointerType !== 'mouse') c.style.opacity = '0' }
    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('pointerdown', onDown, true)
    document.documentElement.addEventListener('mouseleave', onLeave)
    document.documentElement.addEventListener('mouseenter', onEnter)
    return () => {
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerdown', onDown, true)
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
