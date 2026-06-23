import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('delete-button')
export class DeleteButton extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property() endpoint = '';
  @property({ attribute: 'redirect-to' }) redirectTo = '/admin/posts';
  @state() private _confirming = false;
  @state() private _deleting = false;

  private async _delete() {
    this._deleting = true;
    const res = await fetch(this.endpoint, { method: 'DELETE' });
    if (res.ok) {
      window.location.href = this.redirectTo;
    } else {
      this._confirming = false;
      this._deleting = false;
    }
  }

  render() {
    if (this._confirming) {
      return html`
        <span style="font:400 12px 'Space Grotesk',sans-serif;color:var(--color-error);margin-right:6px">Delete this?</span>
        <button
          type="button"
          @click=${this._delete}
          ?disabled=${this._deleting}
          style="font:500 12px 'Space Grotesk',sans-serif;color:var(--color-error);background:none;border:none;cursor:pointer;margin-right:4px"
        >${this._deleting ? 'Deleting…' : 'Yes'}</button>
        <button
          type="button"
          @click=${() => { this._confirming = false; }}
          style="font:400 12px 'Space Grotesk',sans-serif;color:var(--color-meta);background:none;border:none;cursor:pointer"
        >Cancel</button>
      `;
    }

    return html`
      <button
        type="button"
        @click=${() => { this._confirming = true; }}
        style="font:400 12px 'Space Grotesk',sans-serif;color:var(--color-error);background:none;border:none;cursor:pointer"
      >Delete</button>
    `;
  }
}
