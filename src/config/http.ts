// --- API / HTTP ---
export const CONTENT_TYPE_JSON = 'application/json';

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
} as const;

export const ROUTES = {
  WRITING: '/writing',
  ADMIN_POSTS: '/admin/posts',
  ADMIN_SUBSCRIBERS: '/admin/subscribers',
  API_NEWSLETTER: '/api/newsletter',
  API_NEWSLETTER_CONFIRM: '/api/newsletter/confirm',
  API_UNSUBSCRIBE: '/api/unsubscribe',
  API_SEARCH_INDEX: '/api/search-index.json',
  API_ADMIN_MEDIA_UPLOAD: '/api/admin/media/upload',
} as const;

// --- Pagination / query ---
export const QUERY_PARAM = {
  PAGE: 'page',
  PER_PAGE: 'perPage',
} as const;
export const DEFAULT_PER_PAGE = 6;

// --- DB error patterns ---
export const DB_ERROR_UNIQUE_CONSTRAINT = 'UNIQUE constraint';
