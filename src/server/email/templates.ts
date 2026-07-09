import type { BlogPost } from '@/types/content';

function shell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;background:#fbfbfd;font-family:'Space Grotesk',system-ui,-apple-system,sans-serif;color:#1a1c2e">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px">
    ${bodyHtml}
    <p style="margin-top:32px;font-size:11px;color:#9a9dab;font-family:monospace">Pavlo Romanenko · pavloromanenko.com</p>
  </div>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#3a7d6c;color:#fff;text-decoration:none;font-size:14px;font-weight:500;padding:11px 22px;border-radius:6px">${label}</a>`;
}

export function confirmUrl(origin: string, token: string): string {
  return `${origin}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;
}

export function unsubscribeUrl(origin: string, token: string): string {
  return `${origin}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function confirmationEmail(origin: string, token: string): { subject: string; html: string } {
  const url = confirmUrl(origin, token);
  return {
    subject: 'Confirm your subscription',
    html: shell(`
      <h1 style="font-size:20px;font-weight:400;margin:0 0 12px">Confirm your subscription</h1>
      <p style="font-size:14px;line-height:1.6;color:#44475a;margin:0 0 24px">
        Tap the button below to confirm you'd like to receive new posts. If you didn't request this, you can ignore this email — nothing will be sent.
      </p>
      ${button(url, 'Confirm subscription')}
      <p style="font-size:12px;color:#9a9dab;margin:24px 0 0">Or paste this link into your browser:<br>${url}</p>
    `),
  };
}

export function articleEmail(
  origin: string,
  post: Pick<BlogPost, 'title' | 'slug' | 'excerpt'>,
  unsubscribeToken: string,
): { subject: string; html: string } {
  const postUrl = `${origin}/writing/${post.slug}`;
  const unsubUrl = unsubscribeUrl(origin, unsubscribeToken);
  return {
    subject: post.title,
    html: shell(`
      <p style="font-size:11px;font-family:monospace;letter-spacing:.1em;text-transform:uppercase;color:#a7aab8;margin:0 0 12px">New post</p>
      <h1 style="font-size:22px;font-weight:400;line-height:1.3;margin:0 0 12px">${post.title}</h1>
      <p style="font-size:14px;line-height:1.6;color:#44475a;margin:0 0 24px">${post.excerpt}</p>
      ${button(postUrl, 'Read the post')}
      <p style="font-size:11px;color:#9a9dab;margin:32px 0 0">
        You're receiving this because you confirmed a subscription.
        <a href="${unsubUrl}" style="color:#6b6e7e">Unsubscribe</a>.
      </p>
    `),
  };
}
