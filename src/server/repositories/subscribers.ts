import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import * as schema from '@/server/db/schema';
import type { NewsletterSubscriber } from '@/types/content';

export async function getAllSubscribers(d1: D1Database): Promise<NewsletterSubscriber[]> {
  const db = getDb(d1);
  return db.select().from(schema.newsletterSubscribers).orderBy(desc(schema.newsletterSubscribers.subscribedAt));
}

export async function deleteSubscriber(d1: D1Database, id: number): Promise<boolean> {
  const db = getDb(d1);
  const result = await db.delete(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.id, id));
  return result.rowsAffected > 0;
}

export async function getConfirmedSubscribers(d1: D1Database): Promise<NewsletterSubscriber[]> {
  const db = getDb(d1);
  return db
    .select()
    .from(schema.newsletterSubscribers)
    .where(eq(schema.newsletterSubscribers.confirmed, true));
}
