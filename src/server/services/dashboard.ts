import { sql } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import * as schema from '@/server/db/schema';

export async function getDashboardStats(d1: D1Database) {
  const db = getDb(d1);
  const [posts, pages, subscribers, media] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(schema.posts),
    db.select({ count: sql<number>`count(*)` }).from(schema.pages),
    db.select({ count: sql<number>`count(*)` }).from(schema.newsletterSubscribers),
    db.select({ count: sql<number>`count(*)` }).from(schema.mediaFiles),
  ]);
  return {
    postCount: Number(posts[0].count),
    pageCount: Number(pages[0].count),
    subscriberCount: Number(subscribers[0].count),
    mediaCount: Number(media[0].count),
  };
}
