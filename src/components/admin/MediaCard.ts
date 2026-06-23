import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { COPY_FEEDBACK_MS } from '../../consts';
import { formatFileSize } from '../../lib/format';

@customElement('media-card')
export class MediaCard extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ type: Number }) fileId = 0;
  @property() fileKey = '';
  @property() filename = '';
  @property() contentType = '';
  @property({ type: Number }) size = 0;
  @property() alt = '';

  @state() private _editingAlt = false;
  @state() private _altValue = '';
  @state() private _saving = false;
  @state() private _confirmDelete = false;
  @state() private _deleting = false;
  @state() private _copied = false;

  private async _copyUrl() {
    const url = `${window.location.origin}/media/${this.fileKey}`;
    await navigator.clipboard.writeText(url);
    this._copied = true;
    setTimeout(() => { this._copied = false; }, COPY_FEEDBACK_MS);
  }

  private async _copyMarkdown() {
    const url = `/media/${this.fileKey}`;
    const md = `![${this.alt || this.filename}](${url})`;
    await navigator.clipboard.writeText(md);
    this._copied = true;
    setTimeout(() => { this._copied = false; }, COPY_FEEDBACK_MS);
  }

  private _startEditAlt() {
    this._altValue = this.alt;
    this._editingAlt = true;
  }

  private async _saveAlt() {
    this._saving = true;
    const res = await fetch(`/api/admin/media/${this.fileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alt: this._altValue }),
    });
    if (res.ok) {
      this.alt = this._altValue;
      this._editingAlt = false;
    }
    this._saving = false;
  }

  private async _delete() {
    this._deleting = true;
    const res = await fetch(`/api/admin/media/${this.fileId}`, { method: 'DELETE' });
    if (res.ok) {
      this.remove();
    } else {
      this._deleting = false;
      this._confirmDelete = false;
    }
  }

  render() {
    const isSvg = this.contentType === 'image/svg+xml';
    const thumbUrl = `/media/${this.fileKey}`;

    return html`
      <div style="border:1px solid var(--color-border-light);border-radius:8px;overflow:hidden;background:var(--color-surface)">
        <!-- Thumbnail -->
        <a href=${thumbUrl} target="_blank" style="display:block;aspect-ratio:1;background:var(--color-surface-alt);overflow:hidden;position:relative">
          <img
            src=${thumbUrl}
            alt=${this.alt || this.filename}
            loading="lazy"
            style="width:100%;height:100%;object-fit:${isSvg ? 'contain' : 'cover'};display:block"
          />
        </a>

        <!-- Info -->
        <div style="padding:10px 12px">
          <div style="font:400 12px 'Space Grotesk',sans-serif;color:var(--color-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title=${this.filename}>
            ${this.filename}
          </div>
          <div style="font:400 10px 'IBM Plex Mono',monospace;color:var(--color-dim);margin-top:2px">
            ${formatFileSize(this.size)} · ${this.contentType.split('/')[1]?.toUpperCase()}
          </div>

          <!-- Alt text -->
          ${this._editingAlt
            ? html`
              <div style="margin-top:6px;display:flex;gap:4px">
                <input type="text" .value=${this._altValue}
                  @input=${(e: InputEvent) => { this._altValue = (e.target as HTMLInputElement).value; }}
                  @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._saveAlt(); if (e.key === 'Escape') { this._editingAlt = false; } }}
                  placeholder="Alt text"
                  style="flex:1;height:24px;border:1px solid var(--color-border);background:var(--color-surface);border-radius:4px;padding:0 6px;font:400 11px 'IBM Plex Mono',monospace;color:var(--color-ink);outline:none;box-sizing:border-box;min-width:0" />
                <button type="button" @click=${this._saveAlt} ?disabled=${this._saving}
                  style="height:24px;background:#4f56e8;border:none;border-radius:4px;padding:0 8px;font:500 10px 'IBM Plex Mono',monospace;color:#fff;cursor:pointer;white-space:nowrap">${this._saving ? '...' : 'OK'}</button>
              </div>
            `
            : html`
              <div style="margin-top:4px;display:flex;align-items:center;gap:4px">
                <span style="font:400 10px 'IBM Plex Mono',monospace;color:${this.alt ? 'var(--color-meta)' : 'var(--color-placeholder)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1" title=${this.alt || 'No alt text'}>
                  ${this.alt || 'No alt text'}
                </span>
                <button type="button" @click=${this._startEditAlt}
                  style="font:400 10px 'Space Grotesk',sans-serif;color:var(--color-indigo);background:none;border:none;cursor:pointer;padding:0;white-space:nowrap">edit</button>
              </div>
            `
          }

          <!-- Actions -->
          <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" @click=${this._copyUrl}
              style="height:22px;border:1px solid var(--color-border);background:var(--color-surface);border-radius:4px;padding:0 8px;font:400 10px 'IBM Plex Mono',monospace;color:var(--color-meta);cursor:pointer">
              ${this._copied ? 'Copied!' : 'Copy URL'}
            </button>
            <button type="button" @click=${this._copyMarkdown}
              style="height:22px;border:1px solid var(--color-border);background:var(--color-surface);border-radius:4px;padding:0 8px;font:400 10px 'IBM Plex Mono',monospace;color:var(--color-meta);cursor:pointer">
              ![md]
            </button>
            ${this._confirmDelete
              ? html`
                <span style="font:400 10px 'Space Grotesk',sans-serif;color:var(--color-error);line-height:22px">Delete?</span>
                <button type="button" @click=${this._delete} ?disabled=${this._deleting}
                  style="font:500 10px 'Space Grotesk',sans-serif;color:var(--color-error);background:none;border:none;cursor:pointer;padding:0">${this._deleting ? '...' : 'Yes'}</button>
                <button type="button" @click=${() => { this._confirmDelete = false; }}
                  style="font:400 10px 'Space Grotesk',sans-serif;color:var(--color-meta);background:none;border:none;cursor:pointer;padding:0">No</button>
              `
              : html`
                <button type="button" @click=${() => { this._confirmDelete = true; }}
                  style="height:22px;border:1px solid var(--color-error);background:var(--color-surface);border-radius:4px;padding:0 8px;font:400 10px 'IBM Plex Mono',monospace;color:var(--color-error);cursor:pointer">Del</button>
              `
            }
          </div>
        </div>
      </div>
    `;
  }
}
