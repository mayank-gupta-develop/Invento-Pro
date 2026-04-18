import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { query } from "../db.js";

const router = express.Router();

// ISSUE 2 — CREATE AUTH ROUTES
router.post("/login", async (req, res) => {
  console.log("login request received");
  const { email, password } = req.body;

  try {
    const { rows } = await query(
      `SELECT * FROM users 
       WHERE email=$1 OR username=$1 OR phone=$1`,
      [email]
    );

    if (!rows.length) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = rows[0];

    // Check password
    let match = false;
    if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$') || user.password.startsWith('$2y$')) {
      match = await bcrypt.compare(password, user.password);
    } else {
      match = (user.password === password); // Fallback for legacy admin123456
    }

    if (!match) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Set session
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role || "user"
    };

    // Update last_login_at
    await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]);

    res.json({
      success: true,
      user: req.session.user
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);

    const { rows } = await query(
      `INSERT INTO users (id, username, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role`,
      [crypto.randomUUID(), username, email, hash]
    );

    const user = rows[0];
    
    // Auto-login after registration
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role || "user"
    };

    res.json({
      success: true,
      user: req.session.user
    });
  } catch (err) {
    console.error("Registration error:", err);
    if (err.code === "23505") {
      return res.status(400).json({ error: "Email or username already exists" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

router.get("/me", (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

export default router;
