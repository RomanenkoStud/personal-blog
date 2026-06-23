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
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  body: string;
  updatedAt: string;
}

export interface MediaFile {
  id: number;
  key: string;
  filename: string;
  contentType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string;
  uploadedAt: string;
}

export interface NewsletterSubscriber {
  id: number;
  email: string;
  subscribedAt: string;
}
