import { desc, eq, count, sql, and, type SQL } from 'drizzle-orm';
import { getDb } from './db';
import * as schema from '../db/schema';
import type { BlogPost, Page, ProfileData } from '../types/content';
import { type ListParams, type PaginatedResult, paginate } from './query';
import { PAGE_SLUG, POST_STATUS } from '../consts';

const isPublished = eq(schema.posts.status, POST_STATUS.PUBLISHED);

export async function getPosts(d1: D1Database): Promise<BlogPost[]> {
  const db = getDb(d1);
  return db.select().from(schema.posts).where(isPublished).orderBy(desc(schema.posts.publishedAt));
}

const POST_FILTER_MAP: Record<string, (v: string) => SQL> = {
  area: (v) => eq(schema.posts.area, v),
  featured: (v) => eq(schema.posts.featured, v === 'true'),
};

function buildPostWhere(filters: Record<string, string>): SQL {
  const clauses: SQL[] = [isPublished];
  for (const [key, value] of Object.entries(filters)) {
    if (key in POST_FILTER_MAP) clauses.push(POST_FILTER_MAP[key](value));
  }
  return clauses.length === 1 ? clauses[0] : and(...clauses)!;
}

export async function getPostsList(
  d1: D1Database,
  params: ListParams,
): Promise<PaginatedResult<BlogPost>> {
  const db = getDb(d1);
  const where = buildPostWhere(params.filters);

  const [rows, totalResult] = await Promise.all([
    db.select().from(schema.posts)
      .where(where)
      .orderBy(desc(schema.posts.publishedAt))
      .limit(params.perPage)
      .offset((params.page - 1) * params.perPage),
    db.select({ value: count() }).from(schema.posts).where(where),
  ]);

  return paginate(rows, totalResult[0].value, params);
}

export async function getAreas(d1: D1Database): Promise<{ area: string; count: number }[]> {
  const db = getDb(d1);
  const results = await db
    .select({ area: schema.posts.area, count: count() })
    .from(schema.posts)
    .where(isPublished)
    .groupBy(schema.posts.area)
    .orderBy(desc(count()));
  return results;
}

export async function getPostBySlug(d1: D1Database, slug: string): Promise<BlogPost | null> {
  const db = getDb(d1);
  const results = await db
    .select()
    .from(schema.posts)
    .where(and(eq(schema.posts.slug, slug), isPublished));
  return results[0] ?? null;
}

export async function getFeaturedPosts(d1: D1Database): Promise<BlogPost[]> {
  const db = getDb(d1);
  return db
    .select()
    .from(schema.posts)
    .where(and(eq(schema.posts.featured, true), isPublished))
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

export async function getProfile(d1: D1Database): Promise<ProfileData | null> {
  const page = await getPage(d1, PAGE_SLUG.ABOUT);
  if (!page) return null;
  try {
    const raw = JSON.parse(page.body);
    return { socials: [], ...raw } as ProfileData;
  } catch {
    return null;
  }
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
    .where(isPublished)
    .orderBy(desc(schema.posts.publishedAt));
}
