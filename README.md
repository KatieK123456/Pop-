# Pop! — Starter Project

## What's here
- `server/` — Express backend + PostgreSQL connection + signup/login routes
- `client/` — React (Vite) frontend with a nav bar, Feed, Signup, Login, and Profile pages

## First-time setup

1. **Create the database**
   ```
   createdb pop_db
   psql pop_db -f server/schema.sql
   ```

2. **Configure the backend**
   ```
   cd server
   cp .env.example .env
   ```
   Open `.env` and set `DB_USER` to your Mac username (run `whoami` in Terminal if unsure).
   Leave `DB_PASSWORD` blank if you didn't set one for local Postgres.

3. **Install and run the backend**
   ```
   npm install
   npm run dev
   ```
   You should see "Pop server listening on http://localhost:3001"

4. **Install and run the frontend** (in a new terminal tab)
   ```
   cd client
   npm install
   npm run dev
   ```
   Open the URL it gives you (usually http://localhost:5173)

5. **Test it**: try signing up with a fake `@depauw.edu` email, then try a non-university
   email and confirm it's rejected.

## Push to GitHub
```
git init
git add .
git commit -m "initial project setup: auth, nav, profile skeleton"
git branch -M main
git remote add origin <your GitHub repo URL>
git push -u origin main
```

## What's next
- Build the Feed to actually pull listings from the `listings` table
- Build a "create listing" form that inserts into `listings`
- Build out the Profile tabs to query `listings`, `wishlist`, and `transactions`
  for the current user

