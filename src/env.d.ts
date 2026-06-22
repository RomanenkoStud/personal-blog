/// <reference types="astro/client" />

interface Env {
  DB: D1Database;
  CF_ACCESS_TEAM_NAME: string;
}

declare namespace App {
  interface Locals {
    adminEmail?: string;
  }
}
