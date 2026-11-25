import { describe, expect, it } from 'vitest';
import { slugify, validatePage, validatePost, validateUpload } from './validation';

const post = {
  title: 'Hello', slug: 'hello-world', body: 'Body', area: 'web',
  publishedAt: '2026-01-01', excerpt: 'Short', status: 'draft',
};

describe('validatePost', () => {
  it('accepts a complete post', () => {
    expect(validatePost(post)).toEqual({ valid: true, errors: {} });
  });

  it('reports each missing or malformed field', () => {
    const { valid, errors } = validatePost({ ...post, title: ' ', slug: 'Bad Slug', status: 'live' });
    expect(valid).toBe(false);
    expect(Object.keys(errors).sort()).toEqual(['slug', 'status', 'title']);
  });
});

describe('validatePage', () => {
  it('requires title and body', () => {
    expect(validatePage({ title: 'About', body: 'x' }).valid).toBe(true);
    expect(Object.keys(validatePage({}).errors).sort()).toEqual(['body', 'title']);
  });
});

describe('validateUpload', () => {
  const file = (type: string, size: number) => new File([new Uint8Array(size)], 'f', { type });

  it('accepts allowed images under the size limit', () => {
    expect(validateUpload(file('image/png', 100)).valid).toBe(true);
  });

  it('rejects other types, empty and oversized files', () => {
    expect(validateUpload(file('application/pdf', 100)).valid).toBe(false);
    expect(validateUpload(file('image/png', 0)).errors.file).toBe('File is empty');
    expect(validateUpload(file('image/png', 11 * 1024 * 1024)).errors.file).toBe('File must be under 10 MB');
  });
});

describe('slugify', () => {
  it('produces the slug format validatePost accepts', () => {
    const slug = slugify('  Hello, World: Part_2 ');
    expect(slug).toBe('hello-world-part-2');
    expect(validatePost({ ...post, slug }).errors.slug).toBeUndefined();
  });
});
