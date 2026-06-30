export interface BodyPlugin<T = unknown> {
  fenceName: string;
  parse(rawBlock: string): T | null;
}

export type BodyBlock =
  | { type: 'markdown'; content: string }
  | { type: 'plugin'; plugin: string; data: unknown };

const FENCE_RE = /^```(\w*)[^\n]*\n[\s\S]*?^```[ \t]*$/gm;

export function parseBodyBlocks(body: string, plugins: BodyPlugin[]): BodyBlock[] {
  const byFence = new Map<string, BodyPlugin>(plugins.map(p => [p.fenceName, p]));
  const result: BodyBlock[] = [];

  FENCE_RE.lastIndex = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = FENCE_RE.exec(body)) !== null) {
    const before = body.slice(lastIndex, match.index).trim();
    if (before) result.push({ type: 'markdown', content: before });

    const fenceName = match[1];
    const plugin = byFence.get(fenceName);

    if (plugin) {
      const data = plugin.parse(match[0]);
      if (data != null) {
        result.push({ type: 'plugin', plugin: fenceName, data });
        lastIndex = match.index + match[0].length;
        continue;
      }
    }

    // Unrecognised fence or parse returned null — fall through as markdown.
    result.push({ type: 'markdown', content: match[0] });
    lastIndex = match.index + match[0].length;
  }

  const tail = body.slice(lastIndex).trim();
  if (tail) result.push({ type: 'markdown', content: tail });

  return result;
}
