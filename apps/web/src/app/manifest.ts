import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'דשבורד משפחתי',
    short_name: 'משפחה',
    description: 'הדשבורד המשפחתי — משימות, מערכת, ושיחות וידאו.',
    start_url: '/today',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f4f5f7',
    theme_color: '#f4a52a',
    lang: 'he',
    dir: 'rtl',
    icons: [
      // 192x192 is required by PWABuilder / Android Chrome. We render the
      // same dynamic icon at smaller dimensions via the route's query string
      // — Next ignores the query but Chrome treats them as separate URLs.
      { src: '/icon', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
