import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { POST_STATUS } from '../consts';

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  body: text('body').notNull(),
  area: text('area').notNull(),
  publishedAt: text('published_at').notNull(),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  readTime: integer('read_time').notNull(),
  excerpt: text('excerpt').notNull(),
  status: text('status').notNull().default(POST_STATUS.PUBLISHED),
});

export const pages = sqliteTable('pages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  body: text('body').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const mediaFiles = sqliteTable('media_files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  filename: text('filename').notNull(),
  contentType: text('content_type').notNull(),
  size: integer('size').notNull(),
  width: integer('width'),
  height: integer('height'),
  alt: text('alt').notNull().default(''),
  uploadedAt: text('uploaded_at').notNull(),
});

export const newsletterSubscribers = sqliteTable('newsletter_subscribers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  subscribedAt: text('subscribed_at').notNull(),
  confirmed: integer('confirmed', { mode: 'boolean' }).notNull().default(false),
  confirmToken: text('confirm_token'),
  unsubscribeToken: text('unsubscribe_token'),
});
