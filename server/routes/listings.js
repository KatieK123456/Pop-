import express from "express";
import { pool } from "../db.js";

const router = express.Router();

const CATEGORIES = ["Dress", "Top", "Jeans", "Skirt", "Pants", "Outerwear", "Shoes", "Accessories"];
const CONDITIONS = ["New", "Good", "Fair"];
const TYPES = ["sell", "rent"];

// Columns every listing response includes (plus seller info from the users table)
const LISTING_COLUMNS = `
  listings.id, listings.seller_id, listings.title, listings.description, listings.category,
  listings.size, listings.price, listings.condition, listings.listing_type,
  listings.status, listings.photo_url, listings.photo_urls, listings.created_at,
  users.username AS seller_username, users.email AS seller_email`;

// Returns an error message if the listing data is invalid, otherwise null
function validateListing(body) {
  const { title, category, size, price, condition, listing_type, photo_urls } = body;

  if (!title || !category || !size || !price || !condition || !listing_type) {
    return "Please fill in all required fields.";
  }
  if (!CATEGORIES.includes(category)) return "Please choose a valid category.";
  if (!CONDITIONS.includes(condition)) return "Please choose a valid condition.";
  if (!TYPES.includes(listing_type)) return "Listing type must be buy or rent.";
  if (!Array.isArray(photo_urls) || photo_urls.length < 1) return "Please add at least 1 photo.";
  if (photo_urls.length > 5) return "You can add up to 5 photos.";
  if (!photo_urls.every((u) => typeof u === "string" && u.startsWith("http"))) return "One of the photos is not valid.";

  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice) || numericPrice <= 0) {
    return "Price must be a number greater than 0.";
  }
  return null;
}

// GET /api/listings - available listings, newest first, with optional filters
// Query params: category, size, min_price, max_price, listing_type, user_id (to mark which are liked)
router.get("/listings", async (req, res) => {
  const { category, size, min_price, max_price, listing_type, user_id } = req.query;

  const params = [];
  const add = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  let likedSelect = "FALSE AS liked";
  if (user_id) {
    const p = add(user_id);
    likedSelect = `EXISTS (SELECT 1 FROM wishlist WHERE wishlist.listing_id = listings.id AND wishlist.user_id = ${p}) AS liked`;
  }

  const where = ["listings.status = 'available'"];
  if (category) where.push(`listings.category = ${add(category)}`);
  if (size) where.push(`listings.size = ${add(size)}`);
  if (listing_type) where.push(`listings.listing_type = ${add(listing_type)}`);
  if (min_price !== undefined && min_price !== "" && !Number.isNaN(Number(min_price))) {
    where.push(`listings.price >= ${add(Number(min_price))}`);
  }
  if (max_price !== undefined && max_price !== "" && !Number.isNaN(Number(max_price))) {
    where.push(`listings.price <= ${add(Number(max_price))}`);
  }

  try {
    const result = await pool.query(
      `SELECT ${LISTING_COLUMNS}, ${likedSelect}
       FROM listings
       JOIN users ON listings.seller_id = users.id
       WHERE ${where.join(" AND ")}
       ORDER BY listings.created_at DESC`,
      params
    );
    res.json({ listings: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load listings." });
  }
});

// GET /api/listings/:id?user_id=2 - one listing (detail page and edit form)
// With user_id: also says whether they liked it, and shows the sale if they were the buyer or seller.
router.get("/listings/:id", async (req, res) => {
  const { user_id } = req.query;
  try {
    const result = await pool.query(
      `SELECT ${LISTING_COLUMNS}
       FROM listings
       JOIN users ON listings.seller_id = users.id
       WHERE listings.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Listing not found." });
    }
    const listing = result.rows[0];
    listing.liked = false;
    let transaction = null;

    if (user_id) {
      const liked = await pool.query(
        "SELECT 1 FROM wishlist WHERE user_id = $1 AND listing_id = $2",
        [user_id, listing.id]
      );
      listing.liked = liked.rows.length > 0;

      // Only the buyer and the seller get to see who bought it
      const sale = await pool.query(
        `SELECT transactions.type, transactions.date, transactions.buyer_id,
                COALESCE(transactions.price, $3) AS price,
                buyers.username AS buyer_username, buyers.email AS buyer_email
         FROM transactions
         JOIN users AS buyers ON transactions.buyer_id = buyers.id
         WHERE transactions.listing_id = $1
           AND (transactions.buyer_id = $2 OR transactions.seller_id = $2)
         ORDER BY transactions.date DESC
         LIMIT 1`,
        [listing.id, user_id, listing.price]
      );
      transaction = sale.rows[0] || null;
    }

    res.json({ listing, transaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load that listing." });
  }
});

// POST /api/listings - create a new listing
router.post("/listings", async (req, res) => {
  const { seller_id, title, description, category, size, price, condition, listing_type, photo_urls } = req.body;

  if (!seller_id) {
    return res.status(400).json({ error: "You must be logged in to post a listing." });
  }
  const problem = validateListing(req.body);
  if (problem) return res.status(400).json({ error: problem });

  try {
    const result = await pool.query(
      `INSERT INTO listings
         (seller_id, title, description, category, size, price, condition, listing_type, photo_url, photo_urls)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [seller_id, title, description || "", category, size, Number(price), condition, listing_type, photo_urls[0], photo_urls]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong saving your listing." });
  }
});

// PUT /api/listings/:id - edit a listing (only its seller can)
router.put("/listings/:id", async (req, res) => {
  const { seller_id, title, description, category, size, price, condition, listing_type, photo_urls } = req.body;

  const problem = validateListing(req.body);
  if (problem) return res.status(400).json({ error: problem });

  try {
    const existing = await pool.query("SELECT seller_id, status FROM listings WHERE id = $1", [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Listing not found." });
    }
    if (existing.rows[0].seller_id !== Number(seller_id)) {
      return res.status(403).json({ error: "You can only edit your own listings." });
    }
    if (existing.rows[0].status !== "available") {
      return res.status(400).json({ error: "This listing is no longer available, so it can't be edited." });
    }

    await pool.query(
      `UPDATE listings
       SET title = $1, description = $2, category = $3, size = $4, price = $5,
           condition = $6, listing_type = $7, photo_url = $8, photo_urls = $9
       WHERE id = $10`,
      [title, description || "", category, size, Number(price), condition, listing_type, photo_urls[0], photo_urls, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong saving your changes." });
  }
});

// DELETE /api/listings/:id?seller_id=1 - remove a listing (only its seller can)
// This is a "soft delete": the listing is marked 'removed' instead of erased, so it leaves
// the feed and the seller's profile, but anyone who liked it still sees it as Not available.
router.delete("/listings/:id", async (req, res) => {
  const { seller_id } = req.query;

  try {
    const existing = await pool.query("SELECT seller_id, status FROM listings WHERE id = $1", [req.params.id]);
    if (existing.rows.length === 0 || existing.rows[0].status === "removed") {
      return res.status(404).json({ error: "Listing not found." });
    }
    if (existing.rows[0].seller_id !== Number(seller_id)) {
      return res.status(403).json({ error: "You can only delete your own listings." });
    }
    // A bought or rented item is part of someone's Closet, so it stays as is
    if (existing.rows[0].status !== "available") {
      return res.status(400).json({ error: "This item has already been bought or rented, so it can't be deleted." });
    }

    await pool.query("UPDATE listings SET status = 'removed' WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong deleting the listing." });
  }
});

// GET /api/users/:id/listings - a user's own current listings (for their profile)
router.get("/users/:id/listings", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${LISTING_COLUMNS}, FALSE AS liked
       FROM listings
       JOIN users ON listings.seller_id = users.id
       WHERE listings.seller_id = $1 AND listings.status IN ('available', 'pending')
       ORDER BY listings.created_at DESC`,
      [req.params.id]
    );
    res.json({ listings: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load your listings." });
  }
});

export default router;
