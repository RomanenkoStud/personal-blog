import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { THEME } from '../consts';

@customElement('theme-toggle')
export class ThemeToggle extends LitElement {
  createRenderRoot() { return this; }

  @state() private _theme: 'light' | 'dark' = THEME.LIGHT;

  private _mediaQuery: MediaQueryList | null = null;
  private _mediaHandler = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem(THEME.STORAGE_KEY)) {
      this._setTheme(e.matches ? THEME.DARK : THEME.LIGHT);
    }
  };

  connectedCallback() {
    super.connectedCallback();
    const stored = localStorage.getItem(THEME.STORAGE_KEY) as 'light' | 'dark' | null;
    if (stored) {
      this._theme = stored;
    } else {
      this._theme = (document.documentElement.getAttribute(THEME.DATA_ATTR) as 'light' | 'dark') || THEME.LIGHT;
    }
    document.documentElement.setAttribute(THEME.DATA_ATTR, this._theme);

    this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._mediaQuery.addEventListener('change', this._mediaHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._mediaQuery?.removeEventListener('change', this._mediaHandler);
  }

  private _setTheme(theme: 'light' | 'dark') {
    this._theme = theme;
    document.documentElement.setAttribute(THEME.DATA_ATTR, theme);
    localStorage.setItem(THEME.STORAGE_KEY, theme);
  }

  private _toggle() {
    this._setTheme(this._theme === THEME.LIGHT ? THEME.DARK : THEME.LIGHT);
  }

  render() {
    const sunIcon = html`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    const moonIcon = html`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

    return html`
      <button
        @click=${this._toggle}
        class="w-8 h-8 flex items-center justify-center rounded-lg text-dim hover:text-ink hover:bg-mist transition-colors cursor-pointer"
        aria-label=${`Switch to ${this._theme === THEME.LIGHT ? 'dark' : 'light'} mode`}
      >
        ${this._theme === THEME.LIGHT ? moonIcon : sunIcon}
      </button>
    `;
  }
}
