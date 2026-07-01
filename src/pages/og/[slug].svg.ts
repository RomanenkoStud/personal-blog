import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import satori from 'satori';
import { getPostBySlug } from '@/server/repositories/posts';
import { getProfile } from '@/server/services/profile';
import { SITE_TITLE } from '@/config';

let fontCache: ArrayBuffer | null = null;

async function getFont(origin: string): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  const res = await fetch(new URL('/og-font.woff', origin));
  fontCache = await res.arrayBuffer();
  return fontCache;
}

export const GET: APIRoute = async ({ params, url }) => {
  const [post, profile] = await Promise.all([
    getPostBySlug(env.DB, params.slug!),
    getProfile(env.DB),
  ]);
  if (!post) return new Response('Not found', { status: 404 });

  const siteName = profile?.heroName ?? SITE_TITLE;
  const font = await getFont(url.origin);

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#14151f',
          padding: '64px',
          fontFamily: 'Space Grotesk',
        },
        children: [
          {
            type: 'div',
            props: {
              style: { fontSize: 18, color: '#4f56e8', fontWeight: 700, letterSpacing: '0.06em' },
              children: siteName.toUpperCase(),
            },
          },
          {
            type: 'div',
            props: {
              style: {
                flex: 1,
                display: 'flex',
                alignItems: 'center',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: post.title.length > 60 ? 44 : 54,
                      fontWeight: 700,
                      color: '#e8e9f0',
                      lineHeight: 1.2,
                      maxWidth: '900px',
                    },
                    children: post.title,
                  },
                },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: { display: 'flex', alignItems: 'center', gap: '16px' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 14,
                      color: '#14151f',
                      backgroundColor: '#4f56e8',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                    },
                    children: post.area.toUpperCase(),
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { fontSize: 14, color: '#6a6d7e' },
                    children: `${post.readTime} min read`,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Space Grotesk', data: font, weight: 700, style: 'normal' }],
    },
  );

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
