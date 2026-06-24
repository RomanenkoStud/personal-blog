import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ROUTES } from '@/config';

@customElement('media-uploader')
export class MediaUploader extends LitElement {
  createRenderRoot() {
    return this;
  }

  @state() private _uploading = false;
  @state() private _dragover = false;
  @state() private _error = '';
  @state() private _progress = '';

  private async _upload(files: FileList | null) {
    if (!files || files.length === 0) return;

    this._uploading = true;
    this._error = '';
    let uploaded = 0;

    for (const file of Array.from(files)) {
      this._progress = `Uploading ${++uploaded}/${files.length}: ${file.name}`;
      const form = new FormData();
      form.append('file', file);

      try {
        const res = await fetch(ROUTES.API_ADMIN_MEDIA_UPLOAD, {
          method: 'POST',
          body: form,
        });

        if (!res.ok) {
          const result = await res.json();
          this._error = result.errors?.file ?? result.error ?? `Failed: ${file.name}`;
          break;
        }
      } catch {
        this._error = `Network error uploading ${file.name}`;
        break;
      }
    }

    this._uploading = false;
    this._progress = '';

    if (!this._error) {
      window.location.reload();
    }
  }

  private _onFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    this._upload(input.files);
    input.value = '';
  }

  private _onDrop(e: DragEvent) {
    e.preventDefault();
    this._dragover = false;
    this._upload(e.dataTransfer?.files ?? null);
  }

  render() {
    return html`
      <div
        @dragover=${(e: DragEvent) => { e.preventDefault(); this._dragover = true; }}
        @dragleave=${() => { this._dragover = false; }}
        @drop=${this._onDrop}
        style="border:2px dashed ${this._dragover ? 'var(--color-indigo)' : 'var(--color-border)'};border-radius:8px;padding:28px;text-align:center;transition:border-color .15s;background:${this._dragover ? 'var(--color-surface-alt)' : 'transparent'}"
      >
        ${this._uploading
          ? html`<div style="font:400 13px 'IBM Plex Mono',monospace;color:var(--color-meta)">${this._progress}</div>`
          : html`
            <div style="font:400 14px 'Space Grotesk',sans-serif;color:var(--color-dim);margin-bottom:12px">
              Drag & drop images here, or
            </div>
            <label style="display:inline-flex;align-items:center;height:34px;background:#4f56e8;border-radius:6px;padding:0 16px;font:500 12px 'IBM Plex Mono',monospace;color:#fff;cursor:pointer">
              Browse files
              <input type="file" accept="image/*" multiple @change=${this._onFileSelect} style="display:none" />
            </label>
            <div style="font:400 11px 'IBM Plex Mono',monospace;color:var(--color-placeholder);margin-top:8px">
              JPEG, PNG, GIF, WebP, AVIF, SVG — max 10 MB each
            </div>
          `
        }
        ${this._error ? html`<div style="font:400 11px 'IBM Plex Mono',monospace;color:var(--color-error);margin-top:8px">${this._error}</div>` : ''}
      </div>
    `;
  }
}
