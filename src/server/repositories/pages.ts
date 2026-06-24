import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import * as schema from '@/server/db/schema';
import type { Page } from '@/types/content';

export async function getPage(d1: D1Database, slug: string): Promise<Page | null> {
  const db = getDb(d1);
  const results = await db
    .select()
    .from(schema.pages)
    .where(eq(schema.pages.slug, slug));
  return results[0] ?? null;
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
