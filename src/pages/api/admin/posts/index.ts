import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createPost } from '../../../../lib/admin-api';
import { validatePost } from '../../../../lib/validate';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();

  data.readTime = Number(data.readTime);
  data.featured = Boolean(data.featured);

  const validation = validatePost(data);
  if (!validation.valid) {
    return new Response(JSON.stringify({ errors: validation.errors }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const post = await createPost(env.DB, {
      title: data.title,
      slug: data.slug,
      body: data.body,
      area: data.area,
      publishedAt: data.publishedAt,
      featured: data.featured,
      readTime: data.readTime,
      excerpt: data.excerpt,
    });
    return new Response(JSON.stringify({ ok: true, post }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '';
    if (message.includes('UNIQUE constraint')) {
      return new Response(JSON.stringify({ errors: { slug: 'This slug already exists' } }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw e;
  }
};
