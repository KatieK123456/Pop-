-- Update: deleted listings stay in people's Liked tab as "Not available"
-- Safe to run on your existing database (keeps all data). Run once with:
--   psql pop_db -f keep-liked.sql

-- Allow a new listing status, 'removed', for listings the seller deleted
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_status_check;
ALTER TABLE listings ADD CONSTRAINT listings_status_check
  CHECK (status IN ('available', 'pending', 'unavailable', 'removed'));
