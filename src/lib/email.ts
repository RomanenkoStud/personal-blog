import { env } from 'cloudflare:workers';
import { NEWSLETTER_FROM_FALLBACK, NEWSLETTER_FROM_NAME } from '../consts';
import type { BlogPost } from '../types/content';

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email via Resend. When no RESEND_API_KEY is configured (e.g. local
 * dev), it logs the message to the console instead so the full opt-in flow
 * stays testable without secrets.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const apiKey = env.RESEND_API_KEY;
  const from = `${NEWSLETTER_FROM_NAME} <${env.NEWSLETTER_FROM || NEWSLETTER_FROM_FALLBACK}>`;

  if (!apiKey) {
    console.log('[email:dev] No RESEND_API_KEY set — email not sent.');
    console.log(`[email:dev] To: ${message.to}`);
    console.log(`[email:dev] Subject: ${message.subject}`);
    console.log(`[email:dev] HTML:\n${message.html}`);
    return true;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: message.to, subject: message.subject, html: message.html }),
  });

  if (!res.ok) {
    console.error(`[email] Resend failed (${res.status}): ${await res.text()}`);
    return false;
  }
  return true;
}

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
  return `<a href="${href}" style="display:inline-block;background:#4f56e8;color:#fff;text-decoration:none;font-size:14px;font-weight:500;padding:11px 22px;border-radius:6px">${label}</a>`;
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
