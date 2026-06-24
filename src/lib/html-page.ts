export const CONTENT_TYPE_HTML = 'text/html; charset=utf-8';

/** Minimal standalone HTML page for public email-link landings (confirm / unsubscribe). */
export function statusPage(opts: {
  title: string;
  message: string;
  sub: string;
  success: boolean;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${opts.title}</title>
  <style>
    body { font-family: 'Space Grotesk', system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fbfbfd; color: #1a1c2e; }
    .box { text-align: center; max-width: 400px; padding: 40px 24px; }
    .icon { font-size: 32px; margin-bottom: 16px; color: ${opts.success ? '#4f56e8' : '#dc2626'}; }
    h1 { font-size: 20px; font-weight: 400; margin: 0 0 8px; }
    p { font-size: 14px; color: #6b6e7e; margin: 0 0 24px; }
    a { color: #4f56e8; text-decoration: none; font-size: 13px; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">${opts.success ? '✓' : '✗'}</div>
    <h1>${opts.message}</h1>
    <p>${opts.sub}</p>
    <a href="/">&larr; Back to site</a>
  </div>
</body>
</html>`;
}
