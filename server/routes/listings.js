import express from "express";
import { pool } from "../db.js";

const router = express.Router();

const CATEGORIES = ["Dress", "Top", "Jeans", "Skirt", "Pants", "Outerwear", "Shoes", "Accessories"];
const CONDITIONS = ["New", "Good", "Fair"];
const TYPES = ["sell", "rent"];

// GET /api/listings - all available listings, newest first
router.get("/listings", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT listings.id, listings.title, listings.description, listings.category,
              listings.size, listings.price, listings.condition, listings.listing_type,
              listings.status, listings.photo_url, listings.created_at,
              users.username AS seller_username, users.email AS seller_email
       FROM listings
       JOIN users ON listings.seller_id = users.id
       WHERE listings.status = 'available'
       ORDER BY listings.created_at DESC`
    );
    res.json({ listings: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load listings." });
  }
});

// POST /api/listings - create a new listing
router.post("/listings", async (req, res) => {
  const { seller_id, title, description, category, size, price, condition, listing_type, photo_url } = req.body;

  if (!seller_id || !title || !category || !size || !price || !condition || !listing_type) {
    return res.status(400).json({ error: "Please fill in all required fields." });
  }
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: "Please choose a valid category." });
  }
  if (!CONDITIONS.includes(condition)) {
    return res.status(400).json({ error: "Please choose a valid condition." });
  }
  if (!TYPES.includes(listing_type)) {
    return res.status(400).json({ error: "Listing type must be buy or rent." });
  }
  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({ error: "Price must be a number greater than 0." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO listings
         (seller_id, title, description, category, size, price, condition, listing_type, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [seller_id, title, description || "", category, size, numericPrice, condition, listing_type, photo_url || null]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong saving your listing." });
  }
});

export default router;
