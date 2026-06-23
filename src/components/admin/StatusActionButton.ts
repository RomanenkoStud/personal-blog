import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('status-action-button')
export class StatusActionButton extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property() endpoint = '';
  @property({ attribute: 'target-status' }) targetStatus = '';
  @property() label = '';
  @property({ type: Boolean, attribute: 'needs-confirm' }) needsConfirm = false;
  @state() private _confirming = false;
  @state() private _busy = false;

  private async _execute() {
    this._busy = true;
    const res = await fetch(this.endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: this.targetStatus }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      this._confirming = false;
      this._busy = false;
    }
  }

  render() {
    if (this.needsConfirm && this._confirming) {
      return html`
        <span style="font:400 12px 'Space Grotesk',sans-serif;color:var(--color-meta);margin-right:6px">${this.label}?</span>
        <button
          type="button"
          @click=${this._execute}
          ?disabled=${this._busy}
          style="font:500 12px 'Space Grotesk',sans-serif;color:var(--color-meta);background:none;border:none;cursor:pointer;margin-right:4px"
        >${this._busy ? '…' : 'Yes'}</button>
        <button
          type="button"
          @click=${() => { this._confirming = false; }}
          style="font:400 12px 'Space Grotesk',sans-serif;color:var(--color-dim);background:none;border:none;cursor:pointer"
        >Cancel</button>
      `;
    }

    return html`
      <button
        type="button"
        @click=${() => {
          if (this.needsConfirm) this._confirming = true;
          else this._execute();
        }}
        ?disabled=${this._busy}
        style="font:400 12px 'Space Grotesk',sans-serif;color:var(--color-dim);background:none;border:none;cursor:pointer"
      >${this._busy ? '…' : this.label}</button>
    `;
  }
}
