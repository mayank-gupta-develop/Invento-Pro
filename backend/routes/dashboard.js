import express from "express";
import { query } from "../db.js";
import { requireAuth, blockAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, blockAdmin, async (req, res) => {
  try {
    const userId = req.session.user.id;

    // 💰 1. Total Revenue
    const { rows: revenueRows } = await query(
      `SELECT COALESCE(SUM(total),0)::numeric AS total_revenue FROM bills WHERE user_id=$1`,
      [userId]
    );
    const total_revenue = revenueRows[0].total_revenue;

    // 📈 2. Total Sales (Count of bills)
    const { rows: salesRows } = await query(
      `SELECT COALESCE(COUNT(*),0)::int AS total_sales FROM bills WHERE user_id=$1`,
      [userId]
    );
    const total_sales = salesRows[0].total_sales;

    // 📦 3. Total Products
    const { rows: productRows } = await query(
      `SELECT COUNT(*)::int AS count FROM items WHERE user_id=$1`,
      [userId]
    );

    // 🕒 4. Recent Activity (Recent Bills)
    const { rows: recentBills } = await query(
      `SELECT customer_name, total, created_at FROM bills 
       WHERE user_id=$1 
       ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );

    const recentActivity = recentBills.map(b => ({
      message: `New Invoice for ${b.customer_name}`,
      time: new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    // ⚠️ 5. Low Stock count
    const { rows: stockRows } = await query(
      `SELECT COUNT(*)::int AS low_stock FROM (
         SELECT i.id, COALESCE(SUM(sb.qty), 0) as total_qty 
         FROM items i 
         LEFT JOIN stock_batches sb ON sb.item_id = i.id 
         WHERE i.user_id = $1 
         GROUP BY i.id
       ) sub WHERE total_qty < 5`,
      [userId]
    );
    const low_stock = stockRows[0].low_stock;

    // 📊 6. Revenue Trend (Formatted for Recharts as salesGrowth)
    const { rows: revenueTrend } = await query(
      `SELECT TO_CHAR(created_at, 'Mon') AS label, COALESCE(SUM(total),0)::numeric AS value
       FROM bills
       WHERE user_id=$1
       GROUP BY label, DATE_TRUNC('month', created_at)
       ORDER BY DATE_TRUNC('month', created_at) ASC
       LIMIT 12`,
      [userId]
    );

    // 🏆 7. Top Products
    const { rows: topProducts } = await query(
      `SELECT i.name, SUM(bi.qty) as sales, SUM(bi.qty * bi.mrp) as revenue
       FROM bill_items bi
       JOIN items i ON i.id = bi.item_id
       WHERE i.user_id = $1
       GROUP BY i.name
       ORDER BY revenue DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      revenue: Number(total_revenue),
      orders: total_sales,
      products: productRows[0].count,
      lowStock: low_stock,
      salesGrowth: revenueTrend.map(r => ({ label: r.label, value: Number(r.value) })),
      recentActivity,
      topProducts: topProducts.map(p => ({ 
        name: p.name, 
        sales: Number(p.sales), 
        revenue: Number(p.revenue) 
      }))
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

export default router;
