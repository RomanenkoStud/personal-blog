import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { slugify } from '@/lib/validation';

@customElement('slug-field')
export class SlugField extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property() title = '';
  @property() value = '';
  @state() private _manualOverride = false;
  private _prevTitle = '';

  updated() {
    if (this.title !== this._prevTitle && !this._manualOverride && this.title) {
      this._prevTitle = this.title;
      this.value = slugify(this.title);
      this._syncHiddenInput();
    }
  }

  private _syncHiddenInput() {
    const input = this.querySelector<HTMLInputElement>('input[name="slug"]');
    if (input) input.value = this.value;
  }

  private _onInput(e: Event) {
    this._manualOverride = true;
    this.value = (e.target as HTMLInputElement).value;
    this._syncHiddenInput();
  }

  private _resetSync() {
    this._manualOverride = false;
    this.value = slugify(this.title);
    this._syncHiddenInput();
    this.requestUpdate();
  }

  render() {
    return html`
      <div>
        <label style="display:block;font:500 11px 'IBM Plex Mono',monospace;color:var(--color-meta);margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">Slug</label>
        <div style="display:flex;gap:8px;align-items:center">
          <input
            type="text"
            name="slug"
            .value=${this.value}
            @input=${this._onInput}
            required
            style="flex:1;height:36px;border:1px solid var(--color-border);background:var(--color-surface);border-radius:6px;padding:0 10px;font:400 13px 'IBM Plex Mono',monospace;color:var(--color-ink);outline:none;box-sizing:border-box"
          />
          ${this._manualOverride
            ? html`<button
                type="button"
                @click=${this._resetSync}
                style="font:400 10px 'IBM Plex Mono',monospace;color:var(--color-accent);background:none;border:none;cursor:pointer;white-space:nowrap"
              >sync from title</button>`
            : null}
        </div>
      </div>
    `;
  }
}
