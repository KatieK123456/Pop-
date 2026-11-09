import express from "express";
import { pool } from "../db.js";

const router = express.Router();
const MAX_BIO = 200;

// GET /api/users/:id - public profile info (username, bio, email)
router.get("/users/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username, email, bio FROM users WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load that profile." });
  }
});

// PUT /api/users/:id - update your own bio. Body: { user_id, bio }
router.put("/users/:id", async (req, res) => {
  const { user_id, bio } = req.body;

  if (Number(user_id) !== Number(req.params.id)) {
    return res.status(403).json({ error: "You can only edit your own profile." });
  }
  const cleanBio = typeof bio === "string" ? bio.trim() : "";
  if (cleanBio.length > MAX_BIO) {
    return res.status(400).json({ error: `Bio must be ${MAX_BIO} characters or less.` });
  }

  try {
    const result = await pool.query(
      "UPDATE users SET bio = $1 WHERE id = $2 RETURNING id, username, email, bio",
      [cleanBio, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save your bio." });
  }
});

export default router;
