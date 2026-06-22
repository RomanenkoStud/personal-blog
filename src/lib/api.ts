import { desc, eq } from 'drizzle-orm';
import { getDb } from './db';
import * as schema from '../db/schema';
import type { BlogPost, Page } from '../types/content';

export async function getPosts(d1: D1Database): Promise<BlogPost[]> {
  const db = getDb(d1);
  return db.select().from(schema.posts).orderBy(desc(schema.posts.publishedAt));
}

export async function getPostBySlug(d1: D1Database, slug: string): Promise<BlogPost | null> {
  const db = getDb(d1);
  const results = await db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.slug, slug));
  return results[0] ?? null;
}

export async function getFeaturedPosts(d1: D1Database): Promise<BlogPost[]> {
  const db = getDb(d1);
  return db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.featured, true))
    .orderBy(desc(schema.posts.publishedAt));
}

export async function getPage(d1: D1Database, slug: string): Promise<Page | null> {
  const db = getDb(d1);
  const results = await db
    .select()
    .from(schema.pages)
    .where(eq(schema.pages.slug, slug));
  return results[0] ?? null;
}

export async function getSearchIndex(
  d1: D1Database
): Promise<Pick<BlogPost, 'title' | 'slug' | 'area' | 'excerpt'>[]> {
  const db = getDb(d1);
  return db
    .select({
      title: schema.posts.title,
      slug: schema.posts.slug,
      area: schema.posts.area,
      excerpt: schema.posts.excerpt,
    })
    .from(schema.posts)
    .orderBy(desc(schema.posts.publishedAt));
}
