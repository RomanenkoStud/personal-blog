import { desc, eq, ne, count, and, type SQL } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import * as schema from '@/server/db/schema';
import type { BlogPost } from '@/types/content';
import { type ListParams, type PaginatedResult, paginate } from '@/lib/pagination';
import { POST_STATUS } from '@/config';

const isPublished = eq(schema.posts.status, POST_STATUS.PUBLISHED);
const isNotDraft = ne(schema.posts.status, POST_STATUS.DRAFT);

// --- Public (published-facing) queries ---

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
    .where(and(eq(schema.posts.slug, slug), isNotDraft));
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

// --- Admin queries & mutations (all statuses) ---

export async function getAllPosts(d1: D1Database): Promise<BlogPost[]> {
  const db = getDb(d1);
  return db.select().from(schema.posts).orderBy(desc(schema.posts.publishedAt));
}

export async function getPostsByStatus(d1: D1Database, status: string): Promise<BlogPost[]> {
  const db = getDb(d1);
  return db.select().from(schema.posts).where(eq(schema.posts.status, status)).orderBy(desc(schema.posts.publishedAt));
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

export async function updatePostStatus(d1: D1Database, id: number, status: string): Promise<BlogPost | null> {
  const db = getDb(d1);
  const result = await db.update(schema.posts).set({ status }).where(eq(schema.posts.id, id)).returning();
  return result[0] ?? null;
}
