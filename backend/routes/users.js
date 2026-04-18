import express from "express";
import { query } from "../db.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, password required" });
  }
  try {
    const { rows } = await query(
      `INSERT INTO users(id, username, email, password, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, role, created_at`,
      [crypto.randomUUID(), username, email, password, role || "user"]
    );
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to add user" });
  }
});

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { role, username, email, password } = req.body;
  try {
    await query(
      `UPDATE users SET role=COALESCE($1,role), username=COALESCE($2,username), email=COALESCE($3,email), password=COALESCE($4,password) WHERE id=$5`,
      [role, username, email, password, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await query(`DELETE FROM users WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
