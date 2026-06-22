import type { APIRoute } from 'astro';
import { getSearchIndex } from '../../lib/api';

export const GET: APIRoute = async () => {
  const index = await getSearchIndex();
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
};
