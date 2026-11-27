import { describe, expect, it } from 'vitest';
import { deletePost } from './posts';
import { deleteSubscriber } from './subscribers';

/**
 * Minimal D1 stand-in: drizzle's D1 driver calls prepare().bind().run() for a DELETE
 * without RETURNING and returns D1's own result object, whose row count is `meta.changes`
 * (https://developers.cloudflare.com/d1/worker-api/return-object/). Regression for
 * `rowsAffected`, which D1 never sets: deletes reported "not found" after succeeding.
 */
function fakeD1(changes: number) {
  const stmt = {
    bind: () => stmt,
    run: async () => ({ success: true, results: [], meta: { changes, duration: 0, last_row_id: 0, changed_db: changes > 0, size_after: 0, rows_read: 0, rows_written: changes } }),
    all: async () => ({ success: true, results: [], meta: {} }),
    raw: async () => [],
    first: async () => null,
  };
  return { prepare: () => stmt, batch: async () => [], exec: async () => ({ count: 0, duration: 0 }) } as unknown as D1Database;
}

describe('repository deletes report whether a row was deleted', () => {
  it('deletePost', async () => {
    expect(await deletePost(fakeD1(1), 1)).toBe(true);
    expect(await deletePost(fakeD1(0), 404)).toBe(false);
  });

  it('deleteSubscriber', async () => {
    expect(await deleteSubscriber(fakeD1(1), 1)).toBe(true);
    expect(await deleteSubscriber(fakeD1(0), 404)).toBe(false);
  });
});
