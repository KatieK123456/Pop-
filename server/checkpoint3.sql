-- Checkpoint 3 database update
-- Safe to run on your existing database: it only ADDS a column and keeps all your data.
-- Run once with:  psql pop_db -f checkpoint3.sql

-- Remember what the buyer actually paid, even if the listing price changes later
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2);
