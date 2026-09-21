-- Pop database schema
-- Run with: psql pop_db -f schema.sql

DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS wishlist;
DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  bio TEXT DEFAULT ''
);

CREATE TABLE listings (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES users(id),
  category TEXT NOT NULL,
  size TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  condition TEXT NOT NULL,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('sell', 'rent')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending', 'unavailable')),
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE wishlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  listing_id INTEGER NOT NULL REFERENCES listings(id),
  UNIQUE (user_id, listing_id)
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  buyer_id INTEGER NOT NULL REFERENCES users(id),
  seller_id INTEGER NOT NULL REFERENCES users(id),
  listing_id INTEGER NOT NULL REFERENCES listings(id),
  type TEXT NOT NULL CHECK (type IN ('buy', 'rent')),
  date TIMESTAMP DEFAULT NOW()
);
