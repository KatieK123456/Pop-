import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// POST /api/signup
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (!email.toLowerCase().endsWith("@depauw.edu")) {
    return res.status(400).json({ error: "You must sign up with a valid @depauw.edu email." });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "An account with that email already exists." });
    }

    const result = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, bio",
      [username, email, password]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong creating your account." });
  }
});

// POST /api/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    res.json({ user: { id: user.id, username: user.username, email: user.email, bio: user.bio } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong logging in." });
  }
});

export default router;
