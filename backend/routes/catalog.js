import express from "express";
import { query } from "../db.js";
import { requireAuth, blockAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get catalog items (all items for current user with stock)
router.get("/", requireAuth, blockAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT i.*, COALESCE(SUM(sb.qty),0) AS qty
       FROM items i
       LEFT JOIN stock_batches sb ON sb.item_id = i.id
       WHERE i.user_id = $1
       GROUP BY i.id`,
      [req.session.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Catalog fetch error:", err);
    res.status(500).json({ error: "Failed to fetch catalog" });
  }
});

export default router;
