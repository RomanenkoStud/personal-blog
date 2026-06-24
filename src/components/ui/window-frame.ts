/**
 * Enhances the SSR window chrome from `WindowFrame.astro`: wires the close,
 * minimize and maximize traffic-light buttons. Maximize positions the existing
 * card node rather than moving it, so a live sandbox iframe is never reloaded.
 */

const MAXIMIZED_CLASS = 'wf-card-maximized';

class WindowFrame extends HTMLElement {
  private card: HTMLElement | null = null;
  private reopen: HTMLElement | null = null;
  private backdrop: HTMLElement | null = null;

  private onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.restore();
  };

  connectedCallback() {
    this.card = this.querySelector<HTMLElement>('[data-wf-card]');
    this.reopen = this.querySelector<HTMLElement>('[data-wf-reopen]');
    if (!this.card) return;

    this.querySelector('[data-wf-btn="close"]')?.addEventListener('click', () => this.close());
    this.querySelector('[data-wf-btn="min"]')?.addEventListener('click', () => this.toggleMinimize());
    this.querySelector('[data-wf-btn="max"]')?.addEventListener('click', () => this.toggleMaximize());
    this.reopen?.addEventListener('click', () => this.open());
  }

  disconnectedCallback() {
    this.restore();
  }

  private get minimized() {
    return this.dataset.wfState === 'minimized';
  }

  private get isMaximized() {
    return this.card?.classList.contains(MAXIMIZED_CLASS) ?? false;
  }

  private close() {
    this.restore();
    this.dataset.wfState = 'closed';
    if (this.card) this.card.style.display = 'none';
    if (this.reopen) this.reopen.hidden = false;
  }

  private open() {
    delete this.dataset.wfState;
    if (this.card) this.card.style.display = '';
    if (this.reopen) this.reopen.hidden = true;
  }

  private toggleMinimize() {
    this.restore();
    if (this.minimized) delete this.dataset.wfState;
    else this.dataset.wfState = 'minimized';
  }

  private toggleMaximize() {
    if (this.isMaximized) {
      this.restore();
      return;
    }
    if (this.minimized) delete this.dataset.wfState;
    this.card?.classList.add(MAXIMIZED_CLASS);

    const backdrop = document.createElement('div');
    backdrop.className = 'wf-backdrop';
    backdrop.addEventListener('click', () => this.restore());
    document.body.appendChild(backdrop);
    this.backdrop = backdrop;

    document.addEventListener('keydown', this.onKeydown);
  }

  private restore() {
    if (!this.isMaximized) return;
    this.card?.classList.remove(MAXIMIZED_CLASS);
    this.backdrop?.remove();
    this.backdrop = null;
    document.removeEventListener('keydown', this.onKeydown);
  }
}

if (!customElements.get('window-frame')) {
  customElements.define('window-frame', WindowFrame);
}
