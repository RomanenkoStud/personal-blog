import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import * as schema from '@/server/db/schema';
import type { MediaFile } from '@/types/content';

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
