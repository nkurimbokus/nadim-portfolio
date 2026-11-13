import type { MetadataRoute } from 'next'

// Only real pages. /about and the old Adobe Portfolio addresses redirect to /,
// so they are left out on purpose.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-11-13')
  return [
    { url: 'https://nadimkurimbokus.com', lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: 'https://nadimkurimbokus.com/contact', lastModified, changeFrequency: 'yearly', priority: 0.6 },
  ]
}
