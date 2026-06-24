import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getSearchIndex } from '@/server/repositories/posts';
import { jsonResponse } from '@/server/http';

export const GET: APIRoute = async () => {
  const index = await getSearchIndex(env.DB);
  return jsonResponse(index);
};
