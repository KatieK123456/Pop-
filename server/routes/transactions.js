import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// Listing details plus what happened in the transaction (shared by Closet and Sold)
const TRANSACTION_COLUMNS = `
  listings.id, listings.seller_id, listings.title, listings.description, listings.category,
  listings.size, listings.price, listings.condition, listings.listing_type,
  listings.status, listings.photo_url, listings.photo_urls, listings.created_at,
  transactions.id AS transaction_id, transactions.type AS transaction_type,
  COALESCE(transactions.price, listings.price) AS paid_price,
  transactions.date AS transaction_date`;

// POST /api/listings/:id/checkout - simulated buy or rent
// Body: { buyer_id, agreed }  (agreed = the buyer checked "I understand" on the disclosure)
// Records the transaction and marks the listing unavailable, both or neither.
router.post("/listings/:id/checkout", async (req, res) => {
  const { buyer_id, agreed } = req.body;

  if (!buyer_id) {
    return res.status(400).json({ error: "You must be logged in to buy or rent." });
  }
  if (!agreed) {
    return res.status(400).json({ error: "Please confirm you understand how checkout works on Pop." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // FOR UPDATE locks this listing row, so two people can't buy it at the same moment
    const found = await client.query(
      "SELECT id, seller_id, price, listing_type, status FROM listings WHERE id = $1 FOR UPDATE",
      [req.params.id]
    );
    const listing = found.rows[0];

    if (!listing) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Listing not found." });
    }
    if (listing.seller_id === Number(buyer_id)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "You can't buy or rent your own listing." });
    }
    if (listing.status !== "available") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Sorry, this item is no longer available." });
    }

    const type = listing.listing_type === "rent" ? "rent" : "buy";
    const saved = await client.query(
      `INSERT INTO transactions (buyer_id, seller_id, listing_id, type, price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, type, price, date`,
      [buyer_id, listing.seller_id, listing.id, type, listing.price]
    );
    await client.query("UPDATE listings SET status = 'unavailable' WHERE id = $1", [listing.id]);

    await client.query("COMMIT");
    res.status(201).json({ transaction: saved.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23503") {
      return res.status(400).json({ error: "We couldn't find your account. Please log in again." });
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong completing your order." });
  } finally {
    client.release();
  }
});

// GET /api/users/:id/closet - everything this user has bought or rented, newest first
router.get("/users/:id/closet", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${TRANSACTION_COLUMNS},
              sellers.username AS seller_username, sellers.email AS seller_email
       FROM transactions
       JOIN listings ON transactions.listing_id = listings.id
       JOIN users AS sellers ON transactions.seller_id = sellers.id
       WHERE transactions.buyer_id = $1
       ORDER BY transactions.date DESC`,
      [req.params.id]
    );
    res.json({ listings: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load your closet." });
  }
});

// GET /api/users/:id/sales - this user's listings that have been bought or rented
router.get("/users/:id/sales", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${TRANSACTION_COLUMNS},
              buyers.username AS buyer_username, buyers.email AS buyer_email
       FROM transactions
       JOIN listings ON transactions.listing_id = listings.id
       JOIN users AS buyers ON transactions.buyer_id = buyers.id
       WHERE transactions.seller_id = $1
       ORDER BY transactions.date DESC`,
      [req.params.id]
    );
    res.json({ listings: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load your sold items." });
  }
});

export default router;
