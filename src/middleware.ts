import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { AUTH_COOKIE_NAME, HTTP_STATUS, CONTENT_TYPE_JSON } from '@/config';
import { parseCookie, verifyAccessJWT, decodeJWTPayload } from '@/server/auth';

function forbiddenResponse(isApi: boolean): Response {
  if (isApi) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: HTTP_STATUS.FORBIDDEN,
      headers: { 'Content-Type': CONTENT_TYPE_JSON },
    });
  }
  return new Response('Unauthorized', { status: HTTP_STATUS.FORBIDDEN });
}

// Article pages (and draft previews) may embed runnable <code-sandbox> StackBlitz
// projects, which need the page to be cross-origin isolated for WebContainers to
// boot. The embed is loaded with `crossOriginIsolated: true` so StackBlitz serves
// its iframe with matching COEP headers. Google Fonts survive require-corp (they
// send CORP: cross-origin).
const needsCoepCoop = (pathname: string) =>
  pathname.startsWith('/writing/') || pathname.startsWith('/admin/posts/preview/');

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (pathname.startsWith('/writing/')) {
    const response = await next();
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    return response;
  }

  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return next();
  }

  if (import.meta.env.DEV) {
    context.locals.adminEmail = 'dev@localhost';
    const response = await next();
    if (needsCoepCoop(pathname)) {
      response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
      response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    }
    return response;
  }

  const cookie = context.request.headers.get('cookie') ?? '';
  const token = parseCookie(cookie, AUTH_COOKIE_NAME);
  const isApi = pathname.startsWith('/api/admin');

  if (!token) {
    return forbiddenResponse(isApi);
  }

  const teamName = env.CF_ACCESS_TEAM_NAME;
  const isValid = await verifyAccessJWT(token, teamName);

  if (!isValid) {
    return forbiddenResponse(isApi);
  }

  const payload = decodeJWTPayload(token);
  context.locals.adminEmail = (payload.email as string) ?? 'admin';

  const response = await next();
  if (needsCoepCoop(pathname)) {
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  }
  return response;
});
