'use client'

import { useState } from 'react'

// Formspree endpoint for the "Website contact" form.
const FORM_URL = 'https://formspree.io/f/mgakvdva'

type Status = 'idle' | 'sending' | 'sent' | 'error'

// Shared look: thin outlined fields, lowercase tracked labels, same as the
// outlined buttons on the home page.
const fieldClass =
  'w-full bg-transparent border border-current rounded-sm px-4 py-3 text-base tracking-wide ' +
  'placeholder:text-fg-subtle focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue'

const labelClass = 'block mb-2 text-sm tracking-widest lowercase'

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'sending') return
    const form = e.currentTarget
    setStatus('sending')
    try {
      const res = await fetch(FORM_URL, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      })
      if (res.ok) {
        form.reset()
        setStatus('sent')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" className="py-10 text-center">
        <p className="text-2xl md:text-3xl tracking-widest lowercase">Sent</p>
        <p className="mt-4 text-sm md:text-base tracking-wide leading-relaxed">
          Thanks. I&apos;ll reply by email.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-8 px-5 py-3 border border-current rounded-sm text-sm tracking-widest lowercase focus:outline-none focus-visible:underline"
        >
          Send another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate={false}>
      <input type="hidden" name="_subject" value="New enquiry from nadimkurimbokus.com" />

      {/* Honeypot: real people never see or fill this. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }}>
        <label>
          Leave this empty
          <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label htmlFor="cf-name" className={labelClass}>Name</label>
        <input id="cf-name" name="name" type="text" required autoComplete="name" className={fieldClass} />
      </div>

      <div>
        <label htmlFor="cf-email" className={labelClass}>Email</label>
        <input id="cf-email" name="email" type="email" required autoComplete="email" className={fieldClass} />
      </div>

      <div>
        <label htmlFor="cf-location" className={labelClass}>Location</label>
        <input id="cf-location" name="location" type="text" placeholder="Venue or city" className={fieldClass} />
      </div>

      <div>
        <label htmlFor="cf-message" className={labelClass}>Message</label>
        <textarea id="cf-message" name="message" required rows={6} className={fieldClass + ' resize-y'} />
      </div>

      <div className="flex flex-col items-start gap-4">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="px-6 py-3 border border-current rounded-sm text-base tracking-widest lowercase transition-colors hover:text-accent-blue focus:outline-none focus-visible:underline disabled:opacity-50"
        >
          {status === 'sending' ? 'Sending' : 'Send'}
        </button>
        {status === 'error' && (
          <p role="alert" className="no-blend text-sm tracking-wide leading-relaxed" style={{ color: '#C8432A' }}>
            That did not send. Try again, or email{' '}
            <a href="mailto:nkurimbokus@gmail.com" className="underline">nkurimbokus@gmail.com</a>.
          </p>
        )}
      </div>
    </form>
  )
}
