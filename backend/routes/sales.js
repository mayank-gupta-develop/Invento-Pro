import express from "express";
import { query } from "../db.js";
import { requireAuth, blockAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, blockAdmin, async (req, res) => {
  const { startDate, endDate, q } = req.query;
  const userId = req.session.user.id;

  let conditions = [`user_id = $1`];
  let params = [userId];
  let idx = 2;

  if (startDate) {
    conditions.push(`created_at >= $${idx}`);
    params.push(startDate);
    idx++;
  }
  if (endDate) {
    conditions.push(`created_at <= $${idx}`);
    params.push(endDate);
    idx++;
  }
  if (q) {
    conditions.push(`customer_name ILIKE $${idx}`);
    params.push(`%${q}%`);
    idx++;
  }

  const whereClause = conditions.join(" AND ");

  try {
    // 📈 1. Summary Metrics
    const { rows: metrics } = await query(
      `SELECT 
        COALESCE(SUM(total), 0) AS revenue,
        COUNT(*)::int AS orders,
        COALESCE(AVG(total), 0) AS avg_order
       FROM bills WHERE ${whereClause}`,
      params
    );

    // 📊 2. Trend (Daily Revenue)
    const { rows: trend } = await query(
      `SELECT TO_CHAR(created_at, 'Mon DD') AS date, SUM(total) AS revenue
       FROM bills
       WHERE ${whereClause}
       GROUP BY date, DATE_TRUNC('day', created_at)
       ORDER BY DATE_TRUNC('day', created_at) ASC
       LIMIT 15`,
      params
    );

    // 🏆 3. Top Products
    const { rows: topProducts } = await query(
      `SELECT i.name, SUM(bi.qty * bi.mrp) AS revenue
       FROM bill_items bi
       JOIN bills b ON b.id = bi.bill_id
       JOIN items i ON i.id = bi.item_id
       WHERE b.user_id = $1
       GROUP BY i.name
       ORDER BY revenue DESC
       LIMIT 5`,
      [userId]
    );

    // 🕒 4. Recent Sales
    const { rows: recentSales } = await query(
      `SELECT customer_name as customer, total as amount, created_at as date
       FROM bills 
       WHERE ${whereClause}
       ORDER BY created_at DESC LIMIT 10`,
      params
    );

    res.json({
      summary: {
        revenue: Number(metrics[0].revenue).toFixed(2),
        orders: metrics[0].orders,
        avgOrder: Number(metrics[0].avg_order).toFixed(2),
        conversion: "12.5%" // Simulated conversion rate
      },
      trend: trend.map(t => ({ date: t.date, revenue: Number(t.revenue) })),
      topProducts,
      recentSales
    });
  } catch (err) {
    console.error("Sales route error:", err);
    res.status(500).json({ error: "Failed to fetch sales report" });
  }
});

// Export sales to CSV
router.get("/export", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT
        b.invoice_no,
        b.customer_name,
        b.created_at,
        b.total AS bill_total
      FROM bills b
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC`,
      [req.session.user.id]
    );

    let csv = "Invoice,Date,Customer,Total\n";
    rows.forEach(r => {
      csv += `"${r.invoice_no}","${new Date(r.created_at).toLocaleDateString()}","${r.customer_name || ""}",${r.bill_total}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="sales-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error("Sales export error:", err);
    res.status(500).send("Export failed");
  }
});

export default router;
