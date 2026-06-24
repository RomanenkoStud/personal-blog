import { env } from 'cloudflare:workers';
import { NEWSLETTER_FROM_FALLBACK, NEWSLETTER_FROM_NAME } from '@/config';

export interface EmailMessage {
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
