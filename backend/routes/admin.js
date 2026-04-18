import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { query, pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET /api/admin/dashboard - Returns summary stats for admin
router.get("/dashboard", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows: userCount } = await query("SELECT COUNT(*)::int as count FROM users");
    const { rows: productCount } = await query("SELECT COUNT(*)::int as count FROM items");
    const { rows: salesCount } = await query("SELECT COUNT(*)::int as count FROM bills");
    
    // Fetch real users for the overview table
    const { rows: recentUsers } = await query(
      `SELECT id, username as name, email, role, status, created_at as "createdAt", last_login_at
       FROM users 
       ORDER BY last_login_at DESC NULLS LAST, created_at DESC 
       LIMIT 5`
    );

    // Activity log: Who was active based on last_login_at
    const recentActivity = recentUsers.filter(u => u.last_login_at).map(u => ({
      message: `${u.name} was active`,
      time: u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'
    }));

    // Mock chart data (since we don't track historical hits yet, we provide realistic growth)
    const traffic = [
      { label: 'Mon', traffic: 400, sessions: 240 },
      { label: 'Tue', traffic: 300, sessions: 139 },
      { label: 'Wed', traffic: 200, sessions: 980 },
      { label: 'Thu', traffic: 278, sessions: 390 },
      { label: 'Fri', traffic: 189, sessions: 480 },
    ];

    const usersGrowth = [
      { label: 'Week 1', users: 5, active: 2 },
      { label: 'Week 2', users: 12, active: 8 },
      { label: 'Week 3', users: 20, active: 15 },
      { label: 'Week 4', users: userCount[0].count, active: recentUsers.length },
    ];

    res.json({
      totalUsers: userCount[0].count,
      activeUsers: recentUsers.length, 
      totalProducts: productCount[0].count,
      totalSales: salesCount[0].count,
      users: recentUsers,
      recentActivity,
      traffic,
      usersGrowth
    });
  } catch (err) {
    console.error("Admin dash error:", err);
    res.status(500).json({ error: "Failed to fetch admin dashboard" });
  }
});

// GET /api/admin/users - Get all users with detail
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, username as name, email, role, status, created_at as "createdAt" 
       FROM users 
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST /api/admin/users - Add user
router.post("/users", requireAuth, requireAdmin, async (req, res) => {
  const { name, email, role, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (id, username, email, password, role, status)
       VALUES ($1, $2, $3, $4, $5, 'Active')
       RETURNING id, username as name, email, role, status`,
      [crypto.randomUUID(), name, email, hash, role]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error("Add user error:", err);
    res.status(500).json({ error: "Failed to add user" });
  }
});

// PUT /api/admin/users/:id - Update user
router.put("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const { name, email, role } = req.body;
  try {
    await query(
      `UPDATE users SET username=$1, email=$2, role=$3 WHERE id=$4`,
      [name, email, role, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

// DELETE /api/admin/users/:id - Delete user (Cascading)
router.delete("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const userId = req.params.id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // 1. Delete associated data
    await client.query(`DELETE FROM bill_items WHERE bill_id IN (SELECT id FROM bills WHERE user_id = $1)`, [userId]);
    await client.query(`DELETE FROM stock_batches WHERE item_id IN (SELECT id FROM items WHERE user_id = $1)`, [userId]);
    await client.query(`DELETE FROM bills WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM items WHERE user_id = $1`, [userId]);
    // 2. Delete user
    await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Cascade delete error:", err);
    res.status(500).json({ error: "Failed cascading delete" });
  } finally {
    client.release();
  }
});

// PUT /api/admin/users/:id/terminate - Terminate user
router.put("/users/:id/terminate", requireAuth, requireAdmin, async (req, res) => {
  try {
    await query(`UPDATE users SET status='Terminated' WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to terminate user" });
  }
});

// NEW: PUT /api/admin/users/:id/reactivate - Reactivate user
router.put("/users/:id/reactivate", requireAuth, requireAdmin, async (req, res) => {
  try {
    await query(`UPDATE users SET status='Active' WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to reactivate user" });
  }
});

// GET /api/admin/users/export - Export stats
router.get("/users/export", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await query("SELECT username, email, role, created_at FROM users");
    let csv = "Username,Email,Role,Created At\n";
    rows.forEach(r => {
      csv += `${r.username},${r.email},${r.role},${r.created_at}\n`;
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="users.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).send("Export failed");
  }
});

export default router;
