import { QUERY_PARAM, DEFAULT_PER_PAGE } from '../consts';

export interface ListParams {
  page: number;
  perPage: number;
  filters: Record<string, string>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export function parseListParams(
  url: URL,
  opts?: { filterKeys?: string[]; defaultPerPage?: number }
): ListParams {
  const perPage = Math.max(1, Number(url.searchParams.get(QUERY_PARAM.PER_PAGE) || opts?.defaultPerPage || DEFAULT_PER_PAGE));
  const page = Math.max(1, Number(url.searchParams.get(QUERY_PARAM.PAGE) || 1));

  const filters: Record<string, string> = {};
  for (const key of opts?.filterKeys ?? []) {
    const value = url.searchParams.get(key);
    if (value) filters[key] = value;
  }

  return { page, perPage, filters };
}

export function paginate<T>(items: T[], total: number, params: ListParams): PaginatedResult<T> {
  return {
    items,
    total,
    page: params.page,
    perPage: params.perPage,
    totalPages: Math.max(1, Math.ceil(total / params.perPage)),
  };
}

export function buildListHref(
  basePath: string,
  params: ListParams,
  overrides?: { page?: number; filters?: Record<string, string> }
): string {
  const qs = new URLSearchParams();
  const filters = overrides?.filters ?? params.filters;
  for (const [k, v] of Object.entries(filters)) {
    if (v) qs.set(k, v);
  }
  const page = overrides?.page ?? params.page;
  if (page > 1) qs.set(QUERY_PARAM.PAGE, String(page));
  const str = qs.toString();
  return str ? `${basePath}?${str}` : basePath;
}
