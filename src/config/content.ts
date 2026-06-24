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
