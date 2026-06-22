export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  body: string;
  area: string;
  publishedAt: string;
  featured: boolean;
  readTime: number;
  excerpt: string;
  coverImage?: {
    url: string;
    alt: string;
    width: number;
    height: number;
  };
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  body: string;
  updatedAt: string;
}

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}
