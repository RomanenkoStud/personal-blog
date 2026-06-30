import type { BodyPlugin } from './body-parser';

/**
 * Parsing for the in-article ```sandbox directive.
 *
 * Authors embed a runnable StackBlitz project inside a post body with a fenced block:
 *
 *   ```sandbox
 *   repo: owner/repo
 *   branch: main
 *   file: src/index.ts
 *   view: editor
 *   height: 520
 *   title: My Demo
 *   ```
 *
 * Only `repo` is required. The block is detected in the body renderer and replaced
 * with a <code-sandbox> custom element.
 */

export const SANDBOX_FENCE = '```sandbox';

export type SandboxView = 'editor' | 'preview' | 'default';

export interface SandboxConfig {
  /** GitHub slug, e.g. "owner/repo" or "owner/repo/tree/branch/path". */
  repo: string;
  branch?: string;
  /** File to open in the editor, e.g. "src/index.ts". */
  file?: string;
  view: SandboxView;
  height: number;
  title?: string;
}

const VALID_VIEWS: readonly SandboxView[] = ['editor', 'preview', 'default'];

export const SANDBOX_DEFAULT_HEIGHT = 480;

export function isSandboxBlock(chunk: string): boolean {
  return chunk.trimStart().startsWith(SANDBOX_FENCE);
}

/**
 * Parse a ```sandbox fenced block into a config, or return null if it's malformed
 * (missing repo). The chunk includes the opening/closing fences.
 */
export function parseSandboxBlock(chunk: string): SandboxConfig | null {
  const lines = chunk.trim().split('\n');

  // Drop the opening ```sandbox line and a trailing closing ``` if present.
  const inner = lines
    .slice(1)
    .filter(line => line.trim() !== '```');

  const fields: Record<string, string> = {};
  for (const line of inner) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key) fields[key] = value;
  }

  const repo = fields.repo;
  if (!repo) return null;

  const view = VALID_VIEWS.includes(fields.view as SandboxView)
    ? (fields.view as SandboxView)
    : 'default';

  const parsedHeight = Number.parseInt(fields.height, 10);
  const height = Number.isFinite(parsedHeight) && parsedHeight > 0
    ? parsedHeight
    : SANDBOX_DEFAULT_HEIGHT;

  return {
    repo,
    branch: fields.branch || undefined,
    file: fields.file || undefined,
    view,
    height,
    title: fields.title || undefined,
  };
}

export function sandboxOwnerRepo(repo: string): string {
  return repo.split('/tree/')[0];
}

export function sandboxProjectSlug(repo: string, branch?: string): string {
  if (branch && !repo.includes('/tree/')) {
    return `${repo}/tree/${branch}`;
  }
  return repo;
}

export function sandboxStackblitzUrl(repo: string, branch?: string, file?: string): string {
  const slug = sandboxProjectSlug(repo, branch);
  const query = file ? `?file=${encodeURIComponent(file)}` : '';
  return `https://stackblitz.com/github/${slug}${query}`;
}

export const sandboxPlugin: BodyPlugin<SandboxConfig> = {
  fenceName: 'sandbox',
  parse: parseSandboxBlock,
};
