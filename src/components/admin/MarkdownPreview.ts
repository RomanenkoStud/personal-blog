import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { marked } from 'marked';
import { parseBodyBlocks } from '@/lib/body-parser';
import { sandboxPlugin } from '@/lib/sandbox';
import type { SandboxConfig } from '@/lib/sandbox';

marked.use({ gfm: true, breaks: false });

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

    const blocks = parseBodyBlocks(this.content, [sandboxPlugin]);

    return html`
      <div class="post-body" style="padding:16px">
        ${blocks.map(block => {
          if (block.type === 'markdown') {
            return html`<div>${unsafeHTML(marked.parse(block.content) as string)}</div>`;
          }

          if (block.type === 'plugin' && block.plugin === 'sandbox') {
            const sandbox = block.data as SandboxConfig;
            const label = sandbox.title || sandbox.repo;
            return html`
              <div style="margin:12px 0;border:1px dashed var(--color-border);border-radius:6px;padding:10px 14px;display:flex;align-items:center;gap:8px">
                <span style="font:500 10px 'IBM Plex Mono',monospace;color:var(--color-placeholder);text-transform:uppercase;letter-spacing:.08em">sandbox</span>
                <span style="font:400 11px 'IBM Plex Mono',monospace;color:var(--color-meta)">${label}${sandbox.branch ? `@${sandbox.branch}` : ''}</span>
              </div>
            `;
          }

          return nothing;
        })}
      </div>
    `;
  }
}
