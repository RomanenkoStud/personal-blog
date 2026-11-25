import { describe, expect, it } from 'vitest';
import { DEFAULT_PER_PAGE } from '@/config';
import { buildListHref, paginate, parseListParams } from './pagination';

const url = (qs = '') => new URL(`https://example.dev/blog${qs}`);

describe('parseListParams', () => {
  it('defaults to page 1 and the configured page size', () => {
    expect(parseListParams(url())).toEqual({ page: 1, perPage: DEFAULT_PER_PAGE, filters: {} });
  });

  it('clamps page and perPage to at least 1', () => {
    expect(parseListParams(url('?page=-3&perPage=0'))).toMatchObject({ page: 1, perPage: 1 });
    expect(parseListParams(url('?page=0&perPage=-5'))).toMatchObject({ page: 1, perPage: 1 });
    expect(parseListParams(url('?perPage='))).toMatchObject({ perPage: DEFAULT_PER_PAGE });
  });

  it('keeps only the requested, non-empty filters', () => {
    const p = parseListParams(url('?area=web&status=&evil=1'), { filterKeys: ['area', 'status'] });
    expect(p.filters).toEqual({ area: 'web' });
  });
});

describe('paginate', () => {
  it('computes total pages, with at least one page', () => {
    const params = { page: 2, perPage: 5, filters: {} };
    expect(paginate([1, 2], 12, params).totalPages).toBe(3);
    expect(paginate([], 0, params).totalPages).toBe(1);
  });
});

describe('buildListHref', () => {
  const params = { page: 3, perPage: 6, filters: { area: 'web' } };

  it('keeps filters and omits page 1', () => {
    expect(buildListHref('/blog', params)).toBe('/blog?area=web&page=3');
    expect(buildListHref('/blog', params, { page: 1 })).toBe('/blog?area=web');
  });

  it('returns the bare path when there is nothing to encode', () => {
    expect(buildListHref('/blog', { page: 1, perPage: 6, filters: {} })).toBe('/blog');
  });
});
