import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { updatePost, deletePost } from '../../../../lib/admin-api';
import { validatePost } from '../../../../lib/validate';

export const PUT: APIRoute = async ({ params, request }) => {
  const id = Number(params.id);
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: 'Invalid ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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
    const post = await updatePost(env.DB, id, {
      title: data.title,
      slug: data.slug,
      body: data.body,
      area: data.area,
      publishedAt: data.publishedAt,
      featured: data.featured,
      readTime: data.readTime,
      excerpt: data.excerpt,
    });

    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, post }), {
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

export const DELETE: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: 'Invalid ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const deleted = await deletePost(env.DB, id);
  if (!deleted) {
    return new Response(JSON.stringify({ error: 'Post not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
