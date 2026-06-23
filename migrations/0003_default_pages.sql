INSERT OR IGNORE INTO pages (title, slug, body, updated_at)
VALUES
  ('Now', 'now', '## What I''m up to

- Building and writing about frontend architecture
- Tinkering with the home lab
- Reading, thinking, shipping

*This page is updated periodically.*', datetime('now')),
  ('About', 'about', '{}', datetime('now'));
