import type { BlogPost, Page, StrapiResponse } from '../types/content';
import { getMockPosts, getMockPage } from './mock-data';

function useMockData(): boolean {
  return import.meta.env.USE_MOCK_DATA === 'true';
}

function strapiUrl(): string {
  return import.meta.env.STRAPI_URL ?? 'http://localhost:1337';
}

function strapiToken(): string {
  return import.meta.env.STRAPI_TOKEN ?? '';
}

async function fetchFromStrapi<T>(path: string): Promise<T | null> {
  const url = `${strapiUrl()}/api${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = strapiToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.error(
        `Strapi request failed: ${response.status} ${response.statusText} for ${url}`
      );
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`Strapi request error for ${url}:`, error);
    return null;
  }
}

/**
 * Normalize a Strapi v4 single entry from `{ id, attributes: { ... } }`
 * into a flat object with `id` merged into the attributes.
 */
function normalizeStrapiEntry<T extends { id: number }>(
  entry: { id: number; attributes: Record<string, unknown> }
): T {
  return { id: entry.id, ...entry.attributes } as T;
}

/**
 * Normalize an array of Strapi v4 entries.
 */
function normalizeStrapiEntries<T extends { id: number }>(
  entries: { id: number; attributes: Record<string, unknown> }[]
): T[] {
  return entries.map((entry) => normalizeStrapiEntry<T>(entry));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getPosts(): Promise<BlogPost[]> {
  if (useMockData()) {
    return getMockPosts().sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  const result = await fetchFromStrapi<StrapiResponse<{ id: number; attributes: Record<string, unknown> }[]>>(
    '/posts?sort=publishedAt:desc&populate=coverImage'
  );

  if (!result) {
    console.warn('Strapi unavailable, falling back to mock data for getPosts');
    return getMockPosts().sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  return normalizeStrapiEntries<BlogPost>(result.data);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (useMockData()) {
    return getMockPosts().find((post) => post.slug === slug) ?? null;
  }

  const result = await fetchFromStrapi<StrapiResponse<{ id: number; attributes: Record<string, unknown> }[]>>(
    `/posts?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=coverImage`
  );

  if (!result || result.data.length === 0) {
    if (!result) {
      console.warn('Strapi unavailable, falling back to mock data for getPostBySlug');
    }
    return getMockPosts().find((post) => post.slug === slug) ?? null;
  }

  return normalizeStrapiEntry<BlogPost>(result.data[0]);
}

export async function getFeaturedPosts(): Promise<BlogPost[]> {
  if (useMockData()) {
    return getMockPosts().filter((post) => post.featured);
  }

  const result = await fetchFromStrapi<StrapiResponse<{ id: number; attributes: Record<string, unknown> }[]>>(
    '/posts?filters[featured][$eq]=true&sort=publishedAt:desc&populate=coverImage'
  );

  if (!result) {
    console.warn('Strapi unavailable, falling back to mock data for getFeaturedPosts');
    return getMockPosts().filter((post) => post.featured);
  }

  return normalizeStrapiEntries<BlogPost>(result.data);
}

export async function getPage(slug: string): Promise<Page | null> {
  if (useMockData()) {
    return getMockPage(slug);
  }

  const result = await fetchFromStrapi<StrapiResponse<{ id: number; attributes: Record<string, unknown> }[]>>(
    `/pages?filters[slug][$eq]=${encodeURIComponent(slug)}`
  );

  if (!result || result.data.length === 0) {
    if (!result) {
      console.warn('Strapi unavailable, falling back to mock data for getPage');
    }
    return getMockPage(slug);
  }

  return normalizeStrapiEntry<Page>(result.data[0]);
}

export async function getSearchIndex(): Promise<
  Pick<BlogPost, 'title' | 'slug' | 'area' | 'excerpt'>[]
> {
  const posts = await getPosts();
  return posts.map(({ title, slug, area, excerpt }) => ({
    title,
    slug,
    area,
    excerpt,
  }));
}
