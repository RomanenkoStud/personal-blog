import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('markdown-preview')
export class MarkdownPreview extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property() content = '';

  render() {
    if (!this.content.trim()) {
      return html`<div style="font:400 13px 'IBM Plex Mono',monospace;color:var(--color-placeholder);padding:16px;font-style:italic">Start writing to see a preview…</div>`;
    }

    const paragraphs = this.content.split('\n\n');
    return html`
      <div style="padding:16px">
        ${paragraphs.map((p) => {
          if (p.startsWith('## ')) {
            return html`<h2 style="font:600 20px 'Space Grotesk',serif;color:var(--color-ink);margin:24px 0 12px">${p.slice(3)}</h2>`;
          }
          if (p.startsWith('# ')) {
            return html`<h1 style="font:700 24px 'Space Grotesk',serif;color:var(--color-ink);margin:24px 0 12px">${p.slice(2)}</h1>`;
          }
          if (p.startsWith('> ')) {
            const text = p.replace(/^>\s*"?/, '').replace(/"$/, '');
            return html`<div style="padding:16px 0;text-align:center"><div style="font:400 18px/1.4 'Space Grotesk',serif;font-style:italic;color:var(--color-ink)">“${text}”</div></div>`;
          }
          return html`<p style="font:400 15px/1.7 'Space Grotesk',serif;color:var(--color-body);margin:0 0 12px">${p}</p>`;
        })}
      </div>
    `;
  }
}
