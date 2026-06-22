export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validatePost(data: Record<string, unknown>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.title = 'Title is required';
  }
  if (!data.slug || typeof data.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    errors.slug = 'Slug must be lowercase alphanumeric with hyphens';
  }
  if (!data.body || typeof data.body !== 'string' || data.body.trim().length === 0) {
    errors.body = 'Body is required';
  }
  if (!data.area || typeof data.area !== 'string') {
    errors.area = 'Area is required';
  }
  if (!data.publishedAt || typeof data.publishedAt !== 'string') {
    errors.publishedAt = 'Published date is required';
  }
  if (data.readTime === undefined || typeof data.readTime !== 'number' || data.readTime < 1) {
    errors.readTime = 'Read time must be at least 1 minute';
  }
  if (!data.excerpt || typeof data.excerpt !== 'string' || data.excerpt.trim().length === 0) {
    errors.excerpt = 'Excerpt is required';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validatePage(data: Record<string, unknown>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.title = 'Title is required';
  }
  if (!data.body || typeof data.body !== 'string' || data.body.trim().length === 0) {
    errors.body = 'Body is required';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function validateUpload(file: File): ValidationResult {
  const errors: Record<string, string> = {};

  if (!ALLOWED_TYPES.has(file.type)) {
    errors.file = 'Only JPEG, PNG, GIF, WebP, AVIF, and SVG files are allowed';
  }
  if (file.size > MAX_FILE_SIZE) {
    errors.file = 'File must be under 10 MB';
  }
  if (file.size === 0) {
    errors.file = 'File is empty';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
