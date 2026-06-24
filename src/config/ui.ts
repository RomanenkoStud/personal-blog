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
