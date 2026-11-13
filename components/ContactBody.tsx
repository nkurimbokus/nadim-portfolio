import ContactForm from './ContactForm'

// ─── Copy ─────────────────────────────────────────────────────────────────────
// Kept at the top so it is easy to swap.
const INTRO = 'Got a question? Let me know below.'

// The contact content, shared by the /contact route and the slide-up panel on the home page.
export default function ContactBody() {
  return (
    <main className="mx-auto w-full max-w-xl px-6 md:px-0 pt-10 md:pt-16 pb-24">
      <h1 className="text-3xl md:text-5xl tracking-widest lowercase">Contact</h1>
      <p className="mt-5 mb-10 text-lg md:text-2xl tracking-wide leading-snug">{INTRO}</p>

      <ContactForm />

      <div className="mt-16 flex flex-nowrap sm:flex-wrap items-center gap-2 sm:gap-4">
        <a
          href="mailto:nkurimbokus@gmail.com"
          className="whitespace-nowrap px-3 sm:px-5 py-3 border border-current rounded-sm text-[clamp(9px,2.9vw,14px)] sm:text-sm md:text-base tracking-wide sm:tracking-widest lowercase transition-colors hover:text-accent-blue focus:outline-none focus-visible:underline"
        >
          nkurimbokus@gmail.com
        </a>
        <a
          href="https://www.instagram.com/nadim_kurimbokus/"
          target="_blank"
          rel="noopener noreferrer"
          className="whitespace-nowrap px-3 sm:px-5 py-3 border border-current rounded-sm text-[clamp(9px,2.9vw,14px)] sm:text-sm md:text-base tracking-wide sm:tracking-widest lowercase transition-colors hover:text-accent-blue focus:outline-none focus-visible:underline"
        >
          Instagram
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </main>
  )
}
