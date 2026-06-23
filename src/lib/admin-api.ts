import { desc, eq, sql } from 'drizzle-orm';
import { getDb } from './db';
import * as schema from '../db/schema';
import type { BlogPost, Page, MediaFile, NewsletterSubscriber } from '../types/content';

export async function getAllPosts(d1: D1Database): Promise<BlogPost[]> {
  const db = getDb(d1);
  return db.select().from(schema.posts).orderBy(desc(schema.posts.publishedAt));
}

export async function getDistinctAreas(d1: D1Database): Promise<string[]> {
  const db = getDb(d1);
  const rows = await db
    .selectDistinct({ area: schema.posts.area })
    .from(schema.posts)
    .orderBy(schema.posts.area);
  return rows.map(r => r.area);
}

export async function getPostById(d1: D1Database, id: number): Promise<BlogPost | null> {
  const db = getDb(d1);
  const results = await db.select().from(schema.posts).where(eq(schema.posts.id, id));
  return results[0] ?? null;
}

export async function createPost(
  d1: D1Database,
  data: Omit<BlogPost, 'id'>
): Promise<BlogPost> {
  const db = getDb(d1);
  const result = await db.insert(schema.posts).values(data).returning();
  return result[0];
}

export async function updatePost(
  d1: D1Database,
  id: number,
  data: Partial<Omit<BlogPost, 'id'>>
): Promise<BlogPost | null> {
  const db = getDb(d1);
  const result = await db
    .update(schema.posts)
    .set(data)
    .where(eq(schema.posts.id, id))
    .returning();
  return result[0] ?? null;
}

export async function deletePost(d1: D1Database, id: number): Promise<boolean> {
  const db = getDb(d1);
  const result = await db.delete(schema.posts).where(eq(schema.posts.id, id));
  return result.rowsAffected > 0;
}

export async function getPageById(d1: D1Database, id: number): Promise<Page | null> {
  const db = getDb(d1);
  const results = await db.select().from(schema.pages).where(eq(schema.pages.id, id));
  return results[0] ?? null;
}

export async function getAllPages(d1: D1Database): Promise<Page[]> {
  const db = getDb(d1);
  return db.select().from(schema.pages).orderBy(desc(schema.pages.updatedAt));
}

export async function updatePage(
  d1: D1Database,
  id: number,
  data: Partial<Omit<Page, 'id'>>
): Promise<Page | null> {
  const db = getDb(d1);
  const result = await db
    .update(schema.pages)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(schema.pages.id, id))
    .returning();
  return result[0] ?? null;
}

// --- Media Files ---

export async function getAllMedia(d1: D1Database): Promise<MediaFile[]> {
  const db = getDb(d1);
  return db.select().from(schema.mediaFiles).orderBy(desc(schema.mediaFiles.uploadedAt));
}

export async function getMediaById(d1: D1Database, id: number): Promise<MediaFile | null> {
  const db = getDb(d1);
  const results = await db.select().from(schema.mediaFiles).where(eq(schema.mediaFiles.id, id));
  return results[0] ?? null;
}

export async function getMediaByKey(d1: D1Database, key: string): Promise<MediaFile | null> {
  const db = getDb(d1);
  const results = await db.select().from(schema.mediaFiles).where(eq(schema.mediaFiles.key, key));
  return results[0] ?? null;
}

export async function createMediaRecord(d1: D1Database, data: Omit<MediaFile, 'id'>): Promise<MediaFile> {
  const db = getDb(d1);
  const result = await db.insert(schema.mediaFiles).values(data).returning();
  return result[0];
}

export async function updateMediaAlt(d1: D1Database, id: number, alt: string): Promise<MediaFile | null> {
  const db = getDb(d1);
  const result = await db.update(schema.mediaFiles).set({ alt }).where(eq(schema.mediaFiles.id, id)).returning();
  return result[0] ?? null;
}

export async function deleteMediaRecord(d1: D1Database, id: number): Promise<MediaFile | null> {
  const db = getDb(d1);
  const results = await db.select().from(schema.mediaFiles).where(eq(schema.mediaFiles.id, id));
  if (!results[0]) return null;
  await db.delete(schema.mediaFiles).where(eq(schema.mediaFiles.id, id));
  return results[0];
}

// --- Newsletter Subscribers ---

export async function getAllSubscribers(d1: D1Database): Promise<NewsletterSubscriber[]> {
  const db = getDb(d1);
  return db.select().from(schema.newsletterSubscribers).orderBy(desc(schema.newsletterSubscribers.subscribedAt));
}

export async function deleteSubscriber(d1: D1Database, id: number): Promise<boolean> {
  const db = getDb(d1);
  const result = await db.delete(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.id, id));
  return result.rowsAffected > 0;
}

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
