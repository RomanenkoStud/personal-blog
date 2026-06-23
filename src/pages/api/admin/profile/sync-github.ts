import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getProfile } from '../../../../lib/api';
import { jsonResponse } from '../../../../lib/response';
import { HTTP_STATUS } from '../../../../consts';
import { profileToReadme } from '../../../../lib/github-readme';

export const POST: APIRoute = async () => {
  const { GITHUB_TOKEN, GITHUB_REPO } = env;
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return jsonResponse(
      { error: 'GITHUB_TOKEN and GITHUB_REPO must be configured' },
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const profile = await getProfile(env.DB);
  if (!profile) {
    return jsonResponse({ error: 'Profile not found' }, HTTP_STATUS.NOT_FOUND);
  }

  const readme = profileToReadme(profile);
  const apiBase = `https://api.github.com/repos/${GITHUB_REPO}/contents/README.md`;
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'personal-blog-admin',
  };

  let sha: string | undefined;
  try {
    const existing = await fetch(apiBase, { headers });
    if (existing.ok) {
      const data = (await existing.json()) as { sha: string };
      sha = data.sha;
    }
  } catch {
    // file doesn't exist yet — that's fine
  }

  const body: Record<string, string> = {
    message: 'Update profile README',
    content: btoa(unescape(encodeURIComponent(readme))),
  };
  if (sha) body.sha = sha;

  const res = await fetch(apiBase, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    return jsonResponse(
      { error: `GitHub API error: ${res.status} ${err}` },
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return jsonResponse({ ok: true });
};
