import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getPosts } from '@/server/repositories/posts';
import { SITE_URL } from '@/config';

const STATIC_PAGES = ['', '/writing', '/topics', '/about', '/now'];

export const GET: APIRoute = async () => {
  const posts = await getPosts(env.DB);

  const urls = [
    ...STATIC_PAGES.map(path => ({
      loc: `${SITE_URL}${path}`,
      changefreq: 'weekly',
      priority: path === '' ? '1.0' : '0.8',
    })),
    ...posts.map(post => ({
      loc: `${SITE_URL}/writing/${post.slug}`,
      lastmod: post.publishedAt.slice(0, 10),
      changefreq: 'monthly',
      priority: '0.7',
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
