/// <reference types="astro/client" />

declare const __LAST_TENDED__: { date: string; hash: string };

interface Env {
  DB: D1Database;
  CF_ACCESS_TEAM_NAME: string;
  GH_PROFILE_TOKEN: string;
  GITHUB_REPO: string;
  RESEND_API_KEY?: string;
  NEWSLETTER_FROM?: string;
}

declare namespace App {
  interface Locals {
    adminEmail?: string;
  }
}
