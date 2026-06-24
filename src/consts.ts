export const SITE_TITLE = 'Pavlo Romanenko';
export const SITE_DESCRIPTION = 'Frontend engineer. Writing about architecture, tools, and home-lab tinkering.';

export const SITE_URL = 'https://pavloromanenko.com';

export const NAV_LINKS = [
  { href: '/writing', label: 'writing' },
  { href: '/topics', label: 'topics' },
  { href: '/about', label: 'about' },
];

export const DEFAULT_AREAS = ['architecture', 'devex', 'ai', 'cases', 'homelab'] as const;

export const POST_STATUS = {
  PUBLISHED: 'published',
  DRAFT: 'draft',
  ARCHIVED: 'archived',
} as const;

export type PostStatus = typeof POST_STATUS[keyof typeof POST_STATUS];

export const POST_STATUSES = Object.values(POST_STATUS);

// --- Page slugs ---
export const PAGE_SLUG = {
  NOW: 'now',
  ABOUT: 'about',
} as const;

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
  API_SEARCH_INDEX: '/api/search-index.json',
  API_ADMIN_MEDIA_UPLOAD: '/api/admin/media/upload',
} as const;

// --- Auth ---
export const AUTH_COOKIE_NAME = 'CF_Authorization';
export const JWKS_TTL_MS = 5 * 60 * 1000;

// --- Pagination / query ---
export const QUERY_PARAM = {
  PAGE: 'page',
  PER_PAGE: 'perPage',
} as const;
export const DEFAULT_PER_PAGE = 6;

// --- UI limits ---
export const FEATURED_POSTS_COUNT = 5;
export const LATEST_POSTS_COUNT = 5;
export const RELATED_POSTS_COUNT = 3;
export const NOW_SNIPPET_LENGTH = 120;
export const RELATED_TITLE_MAX_LENGTH = 40;

// --- Search ---
export const SEARCH_DEBOUNCE_MS = 200;
export const SEARCH_RESULT_LIMIT = 6;
export const SEARCH_FUSE_THRESHOLD = 0.3;

// --- Media ---
export const MEDIA_CACHE_MAX_AGE = 'public, max-age=31536000, immutable';
export const COPY_FEEDBACK_MS = 1500;
export const NEWSLETTER_RESET_MS = 5000;

// --- Theme ---
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  STORAGE_KEY: 'theme',
  DATA_ATTR: 'data-theme',
} as const;

// --- DB error patterns ---
export const DB_ERROR_UNIQUE_CONSTRAINT = 'UNIQUE constraint';
