import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';

interface JWKSResponse {
  keys: JsonWebKey[];
}

let jwksCache: { keys: JsonWebKey[]; fetchedAt: number } | null = null;
const JWKS_TTL = 5 * 60 * 1000;

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeJWTPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
  return payload;
}

async function fetchJWKS(teamName: string): Promise<JsonWebKey[]> {
  if (jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_TTL) {
    return jwksCache.keys;
  }

  const url = `https://${teamName}.cloudflareaccess.com/cdn-cgi/access/certs`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch JWKS: ${res.status}`);
  }

  const data = (await res.json()) as JWKSResponse;
  jwksCache = { keys: data.keys, fetchedAt: Date.now() };
  return data.keys;
}

async function verifyAccessJWT(token: string, teamName: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0])));
    const kid = header.kid;
    if (!kid) return false;

    const keys = await fetchJWKS(teamName);
    const jwk = keys.find((k: JsonWebKey) => k.kid === kid);
    if (!jwk) return false;

    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const signatureBytes = base64UrlDecode(parts[2]);
    const dataBytes = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signatureBytes, dataBytes);

    if (!valid) return false;

    const payload = decodeJWTPayload(token);
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && payload.exp < now) return false;

    return true;
  } catch {
    return false;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return next();
  }

  if (import.meta.env.DEV) {
    context.locals.adminEmail = 'dev@localhost';
    return next();
  }

  const cookie = context.request.headers.get('cookie') ?? '';
  const token = parseCookie(cookie, 'CF_Authorization');

  if (!token) {
    if (pathname.startsWith('/api/admin')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('Unauthorized', { status: 403 });
  }

  const teamName = env.CF_ACCESS_TEAM_NAME;
  const isValid = await verifyAccessJWT(token, teamName);

  if (!isValid) {
    if (pathname.startsWith('/api/admin')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('Unauthorized', { status: 403 });
  }

  const payload = decodeJWTPayload(token);
  context.locals.adminEmail = (payload.email as string) ?? 'admin';

  return next();
});
