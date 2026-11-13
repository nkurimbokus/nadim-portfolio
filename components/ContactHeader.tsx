'use client'

// Top bar matching the About panel: page name on the left, close on the right. No logo.
export default function ContactHeader({ onClose }: { onClose: () => void }) {
  const text = 'flex items-center min-h-[44px] text-sm md:text-base tracking-widest lowercase'
  return (
    <header className="flex items-center justify-between px-6 md:px-10 h-16">
      <span className={text}>Contact</span>
      <button type="button" onClick={onClose} className={text + ' focus:outline-none focus-visible:underline'}>
        Close
      </button>
    </header>
  )
}
