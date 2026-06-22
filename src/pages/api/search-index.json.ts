import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getSearchIndex } from '../../lib/api';

export const GET: APIRoute = async () => {
  const index = await getSearchIndex(env.DB);
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
};
