import { marked } from 'marked';

const WORDS_PER_MINUTE = 200;

export function calcReadTime(body: string): number {
  const html = String(marked.parse(body));
  const text = html.replace(/<[^>]+>/g, ' ');
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
