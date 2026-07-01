import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getPosts } from '@/server/repositories/posts';
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL } from '@/config';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const GET: APIRoute = async () => {
  const posts = await getPosts(env.DB);

  const items = posts.map(post => `
  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${SITE_URL}/writing/${post.slug}</link>
    <guid isPermaLink="true">${SITE_URL}/writing/${post.slug}</guid>
    <description>${escapeXml(post.excerpt)}</description>
    <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
    <category>${escapeXml(post.area)}</category>
  </item>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
