import { CONTENT_TYPE_JSON } from '../consts';

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': CONTENT_TYPE_JSON },
  });
}
