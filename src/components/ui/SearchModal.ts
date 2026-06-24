import { LitElement, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import Fuse from 'fuse.js';
import { ROUTES, SEARCH_DEBOUNCE_MS, SEARCH_RESULT_LIMIT, SEARCH_FUSE_THRESHOLD } from '@/config';

interface SearchItem {
  title: string;
  slug: string;
  area: string;
  excerpt: string;
}

@customElement('search-modal')
export class SearchModal extends LitElement {
  createRenderRoot() { return this; }

  @state() private _open = false;
  @state() private _query = '';
  @state() private _results: SearchItem[] = [];
  @state() private _selectedIndex = 0;
  @state() private _loading = false;

  private _fuse: Fuse<SearchItem> | null = null;
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private _keydownHandler = (e: KeyboardEvent) => this._handleGlobalKeydown(e);
  private _triggerClickHandler = () => this._openModal();

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this._keydownHandler);
    const trigger = document.getElementById('search-trigger');
    if (trigger) {
      trigger.addEventListener('click', this._triggerClickHandler);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._keydownHandler);
    const trigger = document.getElementById('search-trigger');
    if (trigger) {
      trigger.removeEventListener('click', this._triggerClickHandler);
    }
    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
    }
  }

  private _handleGlobalKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this._openModal();
    }
  }

  private async _openModal() {
    this._open = true;
    this._query = '';
    this._results = [];
    this._selectedIndex = 0;

    if (!this._fuse) {
      this._loading = true;
      try {
        const res = await fetch(ROUTES.API_SEARCH_INDEX);
        const searchIndex: SearchItem[] = await res.json();
        this._fuse = new Fuse(searchIndex, {
          keys: ['title', 'area', 'excerpt'],
          threshold: SEARCH_FUSE_THRESHOLD,
          includeScore: true,
        });
      } catch {
        // Index unavailable; search will return no results
      } finally {
        this._loading = false;
      }
    }

    await this.updateComplete;
    const input = this.querySelector<HTMLInputElement>('#search-input');
    input?.focus();
  }

  private _closeModal() {
    this._open = false;
    this._query = '';
    this._results = [];
    this._selectedIndex = 0;
  }

  private _onInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this._query = value;
    this._selectedIndex = 0;

    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
    }

    this._debounceTimer = setTimeout(() => {
      this._performSearch(value);
    }, SEARCH_DEBOUNCE_MS);
  }

  private _performSearch(query: string) {
    if (!this._fuse || !query.trim()) {
      this._results = [];
      return;
    }
    const fuseResults = this._fuse.search(query, { limit: SEARCH_RESULT_LIMIT });
    this._results = fuseResults.map(r => r.item);
  }

  private _handleModalKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (this._results.length > 0) {
          this._selectedIndex = (this._selectedIndex + 1) % this._results.length;
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (this._results.length > 0) {
          this._selectedIndex = (this._selectedIndex - 1 + this._results.length) % this._results.length;
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (this._results.length > 0 && this._results[this._selectedIndex]) {
          window.location.href = `${ROUTES.WRITING}/${this._results[this._selectedIndex].slug}`;
        }
        break;
      case 'Escape':
        e.preventDefault();
        this._closeModal();
        break;
    }
  }

  private _onBackdropClick(e: MouseEvent) {
    if ((e.target as HTMLElement).id === 'search-backdrop') {
      this._closeModal();
    }
  }

  private _navigateToResult(slug: string) {
    window.location.href = `${ROUTES.WRITING}/${slug}`;
  }

  render() {
    if (!this._open) return nothing;

    const searchIcon = html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;color:var(--color-meta)"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

    return html`
      <div
        id="search-backdrop"
        @click=${this._onBackdropClick}
        @keydown=${this._handleModalKeydown}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        style="position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;padding-top:20vh"
      >
        <div style="width:100%;max-width:32rem;background:var(--color-surface);border:1px solid var(--color-border);border-radius:12px;box-shadow:0 25px 50px -12px rgba(0,0,0,.25);overflow:hidden;margin:0 16px">
          <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--color-border)">
            ${searchIcon}
            <input
              id="search-input"
              type="text"
              .value=${this._query}
              @input=${this._onInput}
              placeholder="Search posts..."
              autocomplete="off"
              spellcheck="false"
              style="flex:1;background:transparent;color:var(--color-ink);font:400 14px 'Space Grotesk',sans-serif;border:none;outline:none"
            />
            <kbd
              @click=${this._closeModal}
              style="padding:2px 6px;border-radius:4px;background:var(--color-mist);border:1px solid var(--color-border);color:var(--color-dim);font:400 10px 'IBM Plex Mono',monospace;cursor:pointer;line-height:1"
            >ESC</kbd>
          </div>
          <div style="max-height:18rem;overflow-y:auto">
            ${this._loading
              ? html`<div style="padding:32px 16px;text-align:center;color:var(--color-meta);font:400 14px 'Space Grotesk',sans-serif">Loading search index...</div>`
              : this._query.trim() === ''
                ? html`<div style="padding:32px 16px;text-align:center;color:var(--color-meta);font:400 14px 'Space Grotesk',sans-serif">Start typing to search...</div>`
                : this._results.length === 0
                  ? html`<div style="padding:32px 16px;text-align:center;color:var(--color-meta);font:400 14px 'Space Grotesk',sans-serif">No results found</div>`
                  : html`
                    <ul style="padding:8px 0;margin:0;list-style:none" role="listbox">
                      ${this._results.map((item, idx) => html`
                        <li
                          role="option"
                          aria-selected=${idx === this._selectedIndex}
                          style="padding:10px 16px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;background:${idx === this._selectedIndex ? 'var(--color-mist)' : 'transparent'};transition:background .1s"
                          @click=${() => this._navigateToResult(item.slug)}
                          @mouseenter=${() => { this._selectedIndex = idx; }}
                        >
                          <span style="font:400 14px 'Space Grotesk',sans-serif;color:var(--color-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.title}</span>
                          ${item.area
                            ? html`<span style="flex-shrink:0;padding:2px 8px;border-radius:99px;background:var(--color-surface-alt);color:var(--color-meta);font:400 10px 'IBM Plex Mono',monospace;border:1px solid var(--color-border-light)">${item.area}</span>`
                            : nothing}
                        </li>
                      `)}
                    </ul>
                  `
            }
          </div>
        </div>
      </div>
    `;
  }
}
