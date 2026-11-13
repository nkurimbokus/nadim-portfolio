import type { Metadata } from 'next'
import ContactRoute from '../../components/ContactRoute'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Book Nadim Kurimbokus for live music, brand and cultural photography in London, the UK and Europe.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return <ContactRoute />
}
