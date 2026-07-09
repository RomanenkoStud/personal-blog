import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('featured-toggle')
export class FeaturedToggle extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property() endpoint = '';
  @property({ type: Boolean }) featured = false;
  @state() private _busy = false;

  private async _toggle() {
    if (this._busy) return;
    this._busy = true;
    const next = !this.featured;
    this.featured = next;

    const res = await fetch(this.endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: next }),
    });

    if (!res.ok) {
      this.featured = !next;
    }
    this._busy = false;
  }

  render() {
    return html`
      <button
        type="button"
        @click=${this._toggle}
        ?disabled=${this._busy}
        title=${this.featured ? 'Remove from featured' : 'Mark as featured'}
        style="background:none;border:none;cursor:pointer;font-size:16px;line-height:1;padding:2px;opacity:${this._busy ? '.4' : '1'};transition:opacity .15s"
      >${this.featured
          ? html`<span style="color:#3a7d6c">&#9733;</span>`
          : html`<span style="color:var(--color-border)">&#9734;</span>`
      }</button>
    `;
  }
}
