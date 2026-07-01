import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

type Status = 'good' | 'ok' | 'bad' | 'na';
interface Check { label: string; status: Status; message: string; }

// ─── Text helpers ────────────────────────────────────────────────────────────

function stripMd(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]+`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/__([^_\n]+)__/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/^[-*+] /gm, '')
    .replace(/^\d+\. /gm, '')
    .replace(/^> ?/gm, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wc(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function hasKw(text: string, kw: string): boolean {
  return text.toLowerCase().includes(kw.toLowerCase());
}

function extractHeadings(md: string) {
  return [...md.matchAll(/^(#{1,6})\s+(.+)$/gm)].map(m => ({ level: m[1].length, text: m[2] }));
}

function extractImages(md: string) {
  return [...md.matchAll(/!\[([^\]]*)\]\([^)]*\)/g)].map(m => ({ alt: m[1] }));
}

function extractParagraphs(md: string): string[] {
  const noCode = md.replace(/```[\s\S]*?```/g, '');
  return noCode.split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p && !p.startsWith('#') && !p.startsWith('    '));
}

// ─── SEO checks ──────────────────────────────────────────────────────────────

function checkKeywordInTitle(kw: string, title: string): Check {
  const label = 'Focus keyword in title';
  if (!kw) return { label, status: 'na', message: 'No focus keyword set.' };
  return hasKw(title, kw)
    ? { label, status: 'good', message: `"${kw}" found in the title.` }
    : { label, status: 'bad', message: `"${kw}" not found in the title.` };
}

function checkKeywordInSlug(kw: string, slug: string): Check {
  const label = 'Focus keyword in slug';
  if (!kw) return { label, status: 'na', message: 'No focus keyword set.' };
  const hit = kw.toLowerCase().split(/\s+/).some(w => slug.includes(w));
  return hit
    ? { label, status: 'good', message: 'Keyword reflected in the slug.' }
    : { label, status: 'ok', message: 'Consider using the keyword in the slug.' };
}

function checkKeywordInExcerpt(kw: string, excerpt: string): Check {
  const label = 'Focus keyword in meta description';
  if (!kw) return { label, status: 'na', message: 'No focus keyword set.' };
  return hasKw(excerpt, kw)
    ? { label, status: 'good', message: 'Keyword found in the meta description.' }
    : { label, status: 'ok', message: 'Add the keyword to the meta description.' };
}

function checkKeywordInIntro(kw: string, body: string): Check {
  const label = 'Focus keyword in introduction';
  if (!kw) return { label, status: 'na', message: 'No focus keyword set.' };
  const intro = stripMd(body).split(/\s+/).slice(0, 150).join(' ');
  return hasKw(intro, kw)
    ? { label, status: 'good', message: 'Keyword appears early in the content.' }
    : { label, status: 'ok', message: 'Use the keyword in the opening paragraph.' };
}

function checkKeywordDensity(kw: string, body: string): Check {
  const label = 'Keyword density';
  if (!kw) return { label, status: 'na', message: 'No focus keyword set.' };
  const plain = stripMd(body);
  const total = wc(plain);
  if (total === 0) return { label, status: 'na', message: 'No content yet.' };
  const re = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const count = (plain.match(re) ?? []).length;
  const pct = (count / total) * 100;
  if (pct < 0.5) return { label, status: 'ok', message: `${pct.toFixed(1)}% — use the keyword a bit more.` };
  if (pct > 2.5) return { label, status: 'bad', message: `${pct.toFixed(1)}% — too high, risks keyword stuffing.` };
  return { label, status: 'good', message: `${pct.toFixed(1)}% — good balance.` };
}

function checkTitleLength(title: string): Check {
  const label = 'SEO title length';
  const n = title.length;
  if (n === 0) return { label, status: 'bad', message: 'Title is empty.' };
  if (n < 50) return { label, status: 'ok', message: `${n} chars — aim for 50–60.` };
  if (n > 70) return { label, status: 'bad', message: `${n} chars — too long, will be truncated.` };
  if (n > 60) return { label, status: 'ok', message: `${n} chars — slightly long.` };
  return { label, status: 'good', message: `${n} chars — perfect.` };
}

function checkExcerptLength(excerpt: string): Check {
  const label = 'Meta description length';
  const n = excerpt.length;
  if (n === 0) return { label, status: 'bad', message: 'Meta description is empty.' };
  if (n < 100) return { label, status: 'bad', message: `${n} chars — too short, aim for 120–160.` };
  if (n < 120) return { label, status: 'ok', message: `${n} chars — a bit short, aim for 120–160.` };
  if (n > 180) return { label, status: 'bad', message: `${n} chars — too long, will be truncated.` };
  if (n > 160) return { label, status: 'ok', message: `${n} chars — slightly long.` };
  return { label, status: 'good', message: `${n} chars — perfect.` };
}

function checkContentLength(body: string): Check {
  const label = 'Content length';
  const n = wc(stripMd(body));
  if (n < 300) return { label, status: 'bad', message: `${n} words — aim for at least 300.` };
  if (n < 600) return { label, status: 'ok', message: `${n} words — decent, longer tends to rank better.` };
  return { label, status: 'good', message: `${n} words — solid length.` };
}

function checkHeadingStructure(body: string): Check {
  const label = 'Heading structure';
  const headings = extractHeadings(body);
  const plain = stripMd(body);
  const long = wc(plain) > 300;

  if (headings.some(h => h.level === 1)) {
    return { label, status: 'ok', message: 'Avoid H1 in body — the post title is already H1.' };
  }
  if (headings.length === 0) {
    return long
      ? { label, status: 'ok', message: 'Long post — add H2 subheadings to break it up.' }
      : { label, status: 'good', message: 'No subheadings needed for short content.' };
  }
  let prev = 1;
  for (const h of headings) {
    if (h.level > prev + 1) {
      return { label, status: 'ok', message: `Heading levels skip from H${prev} to H${h.level}.` };
    }
    prev = h.level;
  }
  return { label, status: 'good', message: `${headings.length} subheading${headings.length > 1 ? 's' : ''} with good hierarchy.` };
}

function checkImageAlts(body: string): Check {
  const label = 'Image alt text';
  const images = extractImages(body);
  if (images.length === 0) return { label, status: 'good', message: 'No images to check.' };
  const missing = images.filter(i => !i.alt.trim()).length;
  if (missing === 0) return { label, status: 'good', message: `All ${images.length} image${images.length > 1 ? 's have' : ' has'} alt text.` };
  return { label, status: 'bad', message: `${missing}/${images.length} image${missing > 1 ? 's are' : ' is'} missing alt text.` };
}

// ─── Readability checks ───────────────────────────────────────────────────────

function checkSentenceLength(body: string): Check {
  const label = 'Sentence length';
  const plain = stripMd(body);
  if (!plain) return { label, status: 'na', message: 'No content yet.' };
  const sents = plain.split(/[.!?]+(?:\s|$)/).filter(s => s.trim().length > 3);
  if (sents.length === 0) return { label, status: 'na', message: 'No sentences found.' };
  const avg = sents.reduce((sum, s) => sum + wc(s), 0) / sents.length;
  if (avg <= 20) return { label, status: 'good', message: `Avg ${avg.toFixed(0)} words/sentence — easy to read.` };
  if (avg <= 25) return { label, status: 'ok', message: `Avg ${avg.toFixed(0)} words/sentence — try to shorten some.` };
  return { label, status: 'bad', message: `Avg ${avg.toFixed(0)} words/sentence — sentences are too long.` };
}

function checkParagraphLength(body: string): Check {
  const label = 'Paragraph length';
  const paras = extractParagraphs(body);
  if (paras.length === 0) return { label, status: 'na', message: 'No content yet.' };
  const long = paras.filter(p => wc(stripMd(p)) > 150);
  if (long.length === 0) return { label, status: 'good', message: 'All paragraphs are a good length.' };
  return { label, status: 'ok', message: `${long.length} paragraph${long.length > 1 ? 's exceed' : ' exceeds'} 150 words — consider splitting.` };
}

function checkSubheadings(body: string): Check {
  const label = 'Subheading distribution';
  const plain = stripMd(body);
  const total = wc(plain);
  const h2s = extractHeadings(body).filter(h => h.level >= 2);
  if (total < 300) return { label, status: 'good', message: 'Short post — no subheadings needed.' };
  if (h2s.length === 0) return { label, status: 'ok', message: 'Add H2 subheadings to improve structure.' };
  const avg = total / (h2s.length + 1);
  if (avg > 300) return { label, status: 'ok', message: `~${Math.round(avg)} words between subheadings — add more H2s.` };
  return { label, status: 'good', message: 'Good subheading distribution.' };
}

// ─── Component ────────────────────────────────────────────────────────────────

const DOT: Record<Status, string> = {
  good: '#22c55e',
  ok: '#f59e0b',
  bad: '#ef4444',
  na: '#9a9dab',
};

@customElement('seo-panel')
export class SeoPanel extends LitElement {
  createRenderRoot() { return this; }

  @property() keyword = '';
  @property() title = '';
  @property() slug = '';
  @property() excerpt = '';
  @property() body = '';

  private get seoChecks(): Check[] {
    const kw = this.keyword.trim();
    return [
      checkKeywordInTitle(kw, this.title),
      checkKeywordInSlug(kw, this.slug),
      checkKeywordInExcerpt(kw, this.excerpt),
      checkKeywordInIntro(kw, this.body),
      checkKeywordDensity(kw, this.body),
      checkTitleLength(this.title),
      checkExcerptLength(this.excerpt),
      checkContentLength(this.body),
      checkHeadingStructure(this.body),
      checkImageAlts(this.body),
    ];
  }

  private get readabilityChecks(): Check[] {
    return [
      checkSentenceLength(this.body),
      checkParagraphLength(this.body),
      checkSubheadings(this.body),
    ];
  }

  private score(checks: Check[]): { color: string; label: string; good: number; active: number } {
    const active = checks.filter(c => c.status !== 'na');
    const good = active.filter(c => c.status === 'good').length;
    const ratio = active.length ? good / active.length : 0;
    const color = ratio >= 0.8 ? '#22c55e' : ratio >= 0.5 ? '#f59e0b' : '#ef4444';
    const label = ratio >= 0.8 ? 'Good' : ratio >= 0.5 ? 'Needs work' : 'Poor';
    return { color, label, good, active: active.length };
  }

  private renderCheck(c: Check) {
    return html`
      <div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-bottom:1px solid var(--color-border-light)">
        <div style="flex-shrink:0;width:8px;height:8px;border-radius:50%;background:${DOT[c.status]};margin-top:3px"></div>
        <div>
          <span style="font:500 11px 'IBM Plex Mono',monospace;color:var(--color-ink)">${c.label}</span>
          <span style="font:400 11px 'IBM Plex Mono',monospace;color:var(--color-meta)"> — ${c.message}</span>
        </div>
      </div>`;
  }

  private renderSection(title: string, checks: Check[]) {
    const { color, label, good, active } = this.score(checks);
    return html`
      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <span style="font:500 10px 'IBM Plex Mono',monospace;color:var(--color-placeholder);text-transform:uppercase;letter-spacing:.1em">${title}</span>
          <span style="font:400 10px 'IBM Plex Mono',monospace;color:${color}">${good}/${active}</span>
        </div>
        ${checks.map(c => this.renderCheck(c))}
      </div>`;
  }

  render() {
    const all = [...this.seoChecks, ...this.readabilityChecks];
    const { color, label } = this.score(all);
    const good = all.filter(c => c.status === 'good').length;
    const active = all.filter(c => c.status !== 'na').length;

    return html`
      <div style="border:1px solid var(--color-border);border-radius:8px;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--color-surface-alt);border-bottom:1px solid var(--color-border)">
          <span style="font:500 11px 'IBM Plex Mono',monospace;color:var(--color-meta);text-transform:uppercase;letter-spacing:.06em">SEO Analysis</span>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:${color}"></div>
            <span style="font:500 11px 'IBM Plex Mono',monospace;color:${color}">${label} · ${good}/${active}</span>
          </div>
        </div>
        <div style="padding:12px 14px;display:flex;flex-direction:column;gap:16px">
          ${this.renderSection('SEO', this.seoChecks)}
          ${this.renderSection('Readability', this.readabilityChecks)}
        </div>
      </div>`;
  }
}
