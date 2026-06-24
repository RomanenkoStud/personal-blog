import { eq } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import * as schema from '@/server/db/schema';
import type { BlogPost } from '@/types/content';
import { getConfirmedSubscribers } from '@/server/repositories/subscribers';
import { sendEmail } from '@/server/email/client';
import { articleEmail } from '@/server/email/templates';

/** Emails every confirmed subscriber about a freshly published post. Returns how many were notified. */
export async function notifySubscribersOfPost(
  d1: D1Database,
  origin: string,
  post: Pick<BlogPost, 'title' | 'slug' | 'excerpt'>,
): Promise<number> {
  const db = getDb(d1);
  const subscribers = await getConfirmedSubscribers(d1);

  await Promise.allSettled(
    subscribers.map(async (sub) => {
      let token = sub.unsubscribeToken;
      if (!token) {
        token = crypto.randomUUID();
        await db
          .update(schema.newsletterSubscribers)
          .set({ unsubscribeToken: token })
          .where(eq(schema.newsletterSubscribers.id, sub.id));
      }
      const { subject, html } = articleEmail(origin, post, token);
      return sendEmail({ to: sub.email, subject, html });
    }),
  );

  return subscribers.length;
}
