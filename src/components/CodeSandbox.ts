import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import type { SandboxView } from '../lib/sandbox';
import { SANDBOX_DEFAULT_HEIGHT, sandboxOwnerRepo, sandboxProjectSlug, sandboxStackblitzUrl } from '../lib/sandbox';

/**
 * Runnable in-article code embed. On click it lazy-loads the StackBlitz SDK to
 * boot a live WebContainer of a GitHub project — editor + running preview —
 * inline in the article. The surrounding window chrome (title bar, traffic
 * lights, GitHub / StackBlitz links) is provided by `WindowFrame.astro`; this
 * element renders only the interactive body.
 *
 * Running requires two things working together:
 *  1. The embedding page is cross-origin isolated (COOP/COEP) — set for
 *     `/writing/*` in middleware.ts.
 *  2. The embed is loaded with `crossOriginIsolated: true` (below) so StackBlitz
 *     serves its iframe with matching COEP headers and isn't blocked.
 *
 * Only WebContainer-compatible projects run: Node/web toolchains with no native
 * bindings. Projects with native deps (e.g. node-sass) boot but fail to install;
 * native/non-Node repos (C++/.NET) can't be imported at all. The "Run in
 * StackBlitz" link opens the full project in a new tab as a fallback.
 *
 * Usage (rendered from the ```sandbox body directive):
 *   <code-sandbox repo="owner/repo" branch="main" file="src/index.ts"></code-sandbox>
 */
@customElement('code-sandbox')
export class CodeSandbox extends LitElement {
  createRenderRoot() { return this; }

  /** GitHub slug, e.g. "owner/repo" or "owner/repo/tree/branch/path". */
  @property({ type: String }) repo = '';
  @property({ type: String }) branch = '';
  @property({ type: String }) file = '';
  @property({ type: String }) view: SandboxView = 'default';
  @property({ type: Number }) height = SANDBOX_DEFAULT_HEIGHT;

  @state() private _state: 'idle' | 'loading' | 'ready' | 'error' = 'idle';

  private _mountRef = createRef<HTMLDivElement>();
  private _embedded = false;

  private get _projectSlug(): string {
    return sandboxProjectSlug(this.repo, this.branch);
  }

  private get _ownerRepo(): string {
    return sandboxOwnerRepo(this.repo);
  }

  private get _stackblitzUrl(): string {
    return sandboxStackblitzUrl(this.repo, this.branch, this.file);
  }

  private async _run() {
    if (this._embedded || !this.repo) return;
    this._state = 'loading';
    // Render the mount node (the loading branch includes it) before embedding.
    await this.updateComplete;

    let sdk: typeof import('@stackblitz/sdk').default;
    try {
      sdk = (await import('@stackblitz/sdk')).default;
    } catch {
      this._state = 'error';
      return;
    }

    const mount = this._mountRef.value;
    if (!mount) {
      this._state = 'error';
      return;
    }

    // embedGithubProject creates the iframe immediately and returns a promise
    // that resolves once the VM connects. For the editor view the VM may never
    // connect, but the code is still fully browsable — so reveal the iframe on
    // either outcome rather than tearing it down.
    const reveal = () => {
      this._embedded = true;
      this._state = 'ready';
    };
    sdk.embedGithubProject(mount, this._projectSlug, {
      height: this.height,
      view: this.view,
      openFile: this.file || undefined,
      hideNavigation: true,
      hideExplorer: false,
      crossOriginIsolated: true,
    }).then(reveal, reveal);
  }

  render() {
    const isLoading = this._state === 'loading';
    const isReady = this._state === 'ready';
    const isError = this._state === 'error';

    return html`
      ${isLoading || isReady
        ? html`
          <div class="relative" style="min-height:${this.height}px">
            <div ${ref(this._mountRef)} style="min-height:${this.height}px"></div>
            ${isLoading
              ? html`
                <div class="absolute inset-0 flex items-center justify-center bg-surface-alt">
                  <p class="font-mono text-[11px] text-meta">booting sandbox…</p>
                </div>`
              : nothing}
          </div>`
        : html`
          <div
            class="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center"
            style="min-height:${Math.min(this.height, 260)}px"
          >
            ${isError
              ? html`
                <p class="font-mono text-[11px] text-error">Couldn't load the sandbox.</p>
                <div class="flex items-center gap-3">
                  <button
                    @click=${this._run}
                    class="cursor-pointer rounded-[5px] bg-indigo px-3.5 py-1.5 font-mono text-[10px] font-medium text-white transition-colors hover:bg-periwinkle"
                  >Retry</button>
                  <a
                    href="${this._stackblitzUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-mono text-[10px] text-indigo no-underline hover:text-periwinkle"
                  >Open in StackBlitz ↗</a>
                </div>
              `
              : html`
                <p class="font-mono text-[11px] text-meta">
                  Runs <span class="text-ink">${this._ownerRepo}</span> live in your browser.
                </p>
                <button
                  @click=${this._run}
                  class="cursor-pointer rounded-[5px] bg-indigo px-4 py-1.5 font-mono text-[10px] font-medium text-white transition-colors hover:bg-periwinkle"
                >▶ Run sandbox</button>
                <p class="font-mono text-[9px] text-placeholder">
                  Boots a Node environment in your browser · no install
                </p>
              `}
          </div>
        `}
    `;
  }
}
