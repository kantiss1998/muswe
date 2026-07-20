import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://muswedaily.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'], // Mencegah bot mengindeks halaman admin dan API
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
