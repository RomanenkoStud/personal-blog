import { LitElement, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { EMAIL_REGEX } from '@/lib/validation';
import { ROUTES, NEWSLETTER_RESET_MS } from '@/config';

type FormState = 'idle' | 'loading' | 'success' | 'error';

@customElement('newsletter-form')
export class NewsletterForm extends LitElement {
  createRenderRoot() { return this; }

  @state() private _email = '';
  @state() private _state: FormState = 'idle';
  @state() private _errorMessage = '';

  private _resetTimer: ReturnType<typeof setTimeout> | null = null;

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._resetTimer !== null) {
      clearTimeout(this._resetTimer);
    }
  }

  private _onInput(e: Event) {
    this._email = (e.target as HTMLInputElement).value;
    if (this._state === 'error') {
      this._state = 'idle';
      this._errorMessage = '';
    }
  }

  private async _onSubmit(e: Event) {
    e.preventDefault();

    const email = this._email.trim();
    if (!email) return;

    if (!EMAIL_REGEX.test(email)) {
      this._state = 'error';
      this._errorMessage = 'Please enter a valid email address.';
      return;
    }

    this._state = 'loading';

    try {
      const res = await fetch(ROUTES.API_NEWSLETTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error('Request failed');

      this._state = 'success';
      this._email = '';

      this._resetTimer = setTimeout(() => {
        this._state = 'idle';
      }, NEWSLETTER_RESET_MS);
    } catch {
      this._state = 'error';
      this._errorMessage = 'Something went wrong. Try again.';
    }
  }

  render() {
    const isLoading = this._state === 'loading';

    return html`
      <div>
        <p class="text-meta text-[11px] font-mono mb-2">A slow newsletter, when I publish.</p>
        <form @submit=${this._onSubmit} class="flex items-center gap-2">
          <input
            type="email"
            .value=${this._email}
            @input=${this._onInput}
            placeholder="you@example.com"
            ?disabled=${isLoading}
            required
            aria-label="Email address"
            class="flex-1 h-[30px] border border-border bg-surface rounded-[5px] px-3 font-mono text-[10px] text-ink outline-none focus:border-indigo placeholder:text-placeholder disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            ?disabled=${isLoading}
            class="h-[30px] bg-indigo rounded-[5px] px-3.5 font-mono text-[10px] font-medium text-white cursor-pointer hover:bg-periwinkle transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ${isLoading ? 'joining...' : 'join'}
          </button>
        </form>

        ${this._state === 'success'
          ? html`<p class="mt-2 text-[11px] font-mono text-indigo">Almost there — check your inbox to confirm.</p>`
          : nothing}

        ${this._state === 'error' && this._errorMessage
          ? html`<p class="mt-2 text-[11px] font-mono text-error">${this._errorMessage}</p>`
          : nothing}
      </div>
    `;
  }
}
