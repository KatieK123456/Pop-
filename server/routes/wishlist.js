import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// POST /api/wishlist/toggle - heart or un-heart a listing
router.post("/wishlist/toggle", async (req, res) => {
  const { user_id, listing_id } = req.body;

  if (!user_id || !listing_id) {
    return res.status(400).json({ error: "You must be logged in to save listings." });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM wishlist WHERE user_id = $1 AND listing_id = $2",
      [user_id, listing_id]
    );

    if (existing.rows.length > 0) {
      await pool.query("DELETE FROM wishlist WHERE id = $1", [existing.rows[0].id]);
      return res.json({ liked: false });
    }

    await pool.query("INSERT INTO wishlist (user_id, listing_id) VALUES ($1, $2)", [user_id, listing_id]);
    res.json({ liked: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update your wishlist." });
  }
});

// GET /api/users/:id/wishlist - everything a user has hearted, most recently liked first
router.get("/users/:id/wishlist", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT listings.id, listings.seller_id, listings.title, listings.description, listings.category,
              listings.size, listings.price, listings.condition, listings.listing_type,
              listings.status, listings.photo_url, listings.photo_urls, listings.created_at,
              users.username AS seller_username, users.email AS seller_email,
              TRUE AS liked
       FROM wishlist
       JOIN listings ON wishlist.listing_id = listings.id
       JOIN users ON listings.seller_id = users.id
       WHERE wishlist.user_id = $1
       ORDER BY wishlist.id DESC`,
      [req.params.id]
    );
    res.json({ listings: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load your wishlist." });
  }
});

export default router;
