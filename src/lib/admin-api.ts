import { desc, eq, sql } from 'drizzle-orm';
import { getDb } from './db';
import * as schema from '../db/schema';
import type { BlogPost, Page } from '../types/content';

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

export async function getDashboardStats(d1: D1Database) {
  const db = getDb(d1);
  const [posts, pages, subscribers] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(schema.posts),
    db.select({ count: sql<number>`count(*)` }).from(schema.pages),
    db.select({ count: sql<number>`count(*)` }).from(schema.newsletterSubscribers),
  ]);
  return {
    postCount: Number(posts[0].count),
    pageCount: Number(pages[0].count),
    subscriberCount: Number(subscribers[0].count),
  };
}
