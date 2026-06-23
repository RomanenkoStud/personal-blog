/// <reference types="astro/client" />

interface Env {
  DB: D1Database;
  CF_ACCESS_TEAM_NAME: string;
  GITHUB_TOKEN: string;
  GITHUB_REPO: string;
}

declare namespace App {
  interface Locals {
    adminEmail?: string;
  }
}
