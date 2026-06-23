export type PostStatus = 'published' | 'draft' | 'archived';

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
  status: PostStatus;
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

export interface ProfileData {
  heroName: string;
  heroBio: string;
  heroTagline: string;
  heroPhoto: string;
  tagline: string;
  bio: string;
  photo: string;
  location: string;
  whatIDo: string[];
  experience: { title: string; startDate: string; endDate: string; location: string }[];
  education: { title: string; startDate: string; endDate: string; location: string }[];
  tech: string[];
  cta: string;
}
