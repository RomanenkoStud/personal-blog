import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getSearchIndex } from '../../lib/api';
import { jsonResponse } from '../../lib/response';

export const GET: APIRoute = async () => {
  const index = await getSearchIndex(env.DB);
  return jsonResponse(index);
};
