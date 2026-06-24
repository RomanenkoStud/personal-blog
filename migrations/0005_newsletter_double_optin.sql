ALTER TABLE newsletter_subscribers ADD COLUMN confirmed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE newsletter_subscribers ADD COLUMN confirm_token TEXT;
ALTER TABLE newsletter_subscribers ADD COLUMN unsubscribe_token TEXT;

-- Existing subscribers opted in under the old single-step flow; treat them as confirmed
-- and give each a token so their unsubscribe links work.
UPDATE newsletter_subscribers SET confirmed = 1;
UPDATE newsletter_subscribers SET unsubscribe_token = lower(hex(randomblob(16))) WHERE unsubscribe_token IS NULL;
