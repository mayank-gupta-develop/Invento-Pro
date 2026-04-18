import express from "express";
import crypto from "crypto";
import { query, pool } from "../db.js";
import { requireAuth, blockAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get unique available years for current user
router.get("/years", requireAuth, blockAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT DISTINCT fy_year FROM bills WHERE user_id=$1 ORDER BY fy_year DESC`,
      [req.session.user.id]
    );
    res.json(rows.map(r => r.fy_year).filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch years" });
  }
});

// Get next invoice number preview
router.get("/next-number", requireAuth, blockAdmin, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { rows: userRows } = await query(`SELECT current_fy FROM users WHERE id=$1`, [userId]);
    const fy = userRows[0]?.current_fy || new Date().getFullYear().toString();

    const { rows: seqRows } = await query(
      `SELECT last_number FROM invoice_seq WHERE user_id=$1 AND year_label=$2`,
      [userId, fy]
    );
    
    const lastNum = seqRows[0]?.last_number || 0;
    const nextNum = lastNum + 1;
    const formatted = `INV-${fy}-${nextNum.toString().padStart(4, "0")}`;
    
    res.json({ nextNumber: formatted });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch next number" });
  }
});

// Reset sequence / Start new financial year
router.post("/reset-sequence", requireAuth, blockAdmin, async (req, res) => {
  const { newYear } = req.body;
  if (!newYear) return res.status(400).json({ error: "Year prefix required" });
  try {
    await query(
      `UPDATE users SET current_fy=$1 WHERE id=$2`,
      [newYear, req.session.user.id]
    );
    // Ensure seq exists or resets
    await query(
      `INSERT INTO invoice_seq (user_id, year_label, last_number)
       VALUES ($1, $2, 0)
       ON CONFLICT (user_id, year_label) DO UPDATE SET last_number = 0`,
      [req.session.user.id, newYear]
    );
    res.json({ success: true, current_fy: newYear });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset sequence" });
  }
});

// Get all bills for current user
router.get("/", requireAuth, blockAdmin, async (req, res) => {
  try {
    const { year } = req.query;
    let sql = `SELECT * FROM bills WHERE user_id=$1`;
    const params = [req.session.user.id];
    
    if (year) {
      sql += ` AND fy_year=$2`;
      params.push(year);
    }
    
    sql += ` ORDER BY created_at DESC`;
    const { rows } = await query(sql, params);

    const normalizedBills = rows.map(b => ({
      ...b,
      subtotal: Number(b.subtotal),
      total: Number(b.total)
    }));

    res.json(normalizedBills);
  } catch (err) {
    console.error("Get bills error:", err);
    res.status(500).json({ error: "Failed to fetch bills" });
  }
});

// Get single bill details
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { rows: billRows } = await query(
      `SELECT * FROM bills WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.session.user.id]
    );
    const bill = billRows[0];
    if (!bill) return res.status(404).json(null);

    const { rows: items } = await query(
      `SELECT bi.*, i.name, i.sku
       FROM bill_items bi
       JOIN items i ON i.id=bi.item_id
       WHERE bi.bill_id=$1`,
      [bill.id]
    );

    res.json({ bill, items });
  } catch (err) {
    console.error("Get bill error:", err);
    res.status(500).json({ error: "Failed to fetch bill details" });
  }
});

// Create or edit bill with transaction and stock validation
router.post("/", requireAuth, blockAdmin, async (req, res) => {
  if (!req.body.customer_name || !req.body.customer_name.trim()) {
    return res.status(400).json({ error: "Customer name is required" });
  }

  const { billId, items, customer_name, customer_phone, customer_email, customer_gst, customer_address, customer_state } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: "Bill has no items" });
  }

  // Calculate totals (Inclusive GST logic)
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  for (const i of items) {
    const itemGross = Number(i.mrp) * Number(i.qty);
    const discPercent = Number(i.discount || 0);
    const discAmount = (itemGross * discPercent) / 100;
    const itemNetGross = itemGross - discAmount;
    // taxable = NetGross / (1 + GST%)
    const taxable = itemNetGross / (1 + (Number(i.gst || 0) / 100));
    const tax = itemNetGross - taxable;
    
    subtotal += itemGross;
    discountTotal += discAmount;
    taxTotal += tax;
  }
  const total = subtotal - discountTotal;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let finalBillId = billId;
    if (billId) {
      // Logic for editing: restore old stock first
      const { rows } = await client.query(
        `SELECT id FROM bills WHERE id=$1 AND user_id=$2`,
        [billId, req.session.user.id]
      );
      if (!rows[0]) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Bill not found" });
      }

      const { rows: oldItems } = await client.query(
        `SELECT item_id, qty, purchase_price FROM bill_items WHERE bill_id=$1`,
        [billId]
      );

      for (const old of oldItems) {
        await client.query(
          `INSERT INTO stock_batches (id,item_id,qty,purchase_price)
           VALUES ($1,$2,$3,$4)`,
          [crypto.randomUUID(), old.item_id, Number(old.qty), Number(old.purchase_price)]
        );
      }
      await client.query(`DELETE FROM bill_items WHERE bill_id=$1`, [billId]);
    }

    // Stock validation
    for (const i of items) {
      const itemId = i.item_id || i.id;
      const { rows } = await client.query(
        `SELECT name FROM items WHERE id=$1 AND user_id=$2`,
        [itemId, req.session.user.id]
      );
      if (!rows[0]) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `Item not found: ${itemId}` });
      }

      const stockRows = await client.query(
        `SELECT COALESCE(SUM(qty), 0) AS available FROM stock_batches WHERE item_id=$1`,
        [itemId]
      );

      const available = Number(stockRows.rows[0].available);
      const requested = Number(i.qty);
      if (requested > available) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "Insufficient stock",
          item: rows[0].name,
          requested,
          available
        });
      }
    }

    if (!billId) {
      finalBillId = crypto.randomUUID();
      
      // Get current FY from user settings
      const { rows: userRows } = await client.query(
        `SELECT current_fy FROM users WHERE id=$1`,
        [req.session.user.id]
      );
      const fy_year = userRows[0]?.current_fy || new Date().getFullYear().toString();

      const { rows: seqRows } = await client.query(
        `SELECT last_number FROM invoice_seq WHERE user_id=$1 AND year_label=$2`,
        [req.session.user.id, fy_year]
      );

      const next = seqRows.length ? seqRows[0].last_number + 1 : 1;
      if (seqRows.length) {
        await client.query(
          `UPDATE invoice_seq SET last_number=$1 WHERE user_id=$2 AND year_label=$3`,
          [next, req.session.user.id, fy_year]
        );
      } else {
        await client.query(
          `INSERT INTO invoice_seq (user_id, year_label, last_number) VALUES ($1,$2,$3)`,
          [req.session.user.id, fy_year, next]
        );
      }

      await client.query(
        `INSERT INTO bills
         (id,user_id,invoice_no,customer_name,customer_phone,customer_email,customer_gst,customer_address,customer_state,subtotal,total,fy_year)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [finalBillId, req.session.user.id, `INV-${fy_year}-${String(next).padStart(4, "0")}`, customer_name, customer_phone, customer_email, customer_gst, customer_address, customer_state, subtotal, total, fy_year]
      );
    } else {
      await client.query(
        `UPDATE bills
         SET customer_name=$1, customer_phone=$2, customer_email=$3, customer_gst=$4, customer_address=$5, customer_state=$6, subtotal=$7, total=$8
         WHERE id=$9 AND user_id=$10`,
        [customer_name, customer_phone, customer_email, customer_gst, customer_address, customer_state, subtotal, total, billId, req.session.user.id]
      );
    }

    for (const i of items) {
      const itemId = i.item_id || i.id;
      // Fetch current purchase price if not provided (for weighted average or just current)
      const priceRows = await client.query(
        `SELECT COALESCE(
          SUM(qty * purchase_price) / NULLIF(SUM(qty), 0),
          0
         ) as avg_p_price 
         FROM stock_batches WHERE item_id=$1 AND qty > 0`,
        [itemId]
      );
      const pPrice = priceRows.rows[0]?.avg_p_price || 0;

      await client.query(
        `INSERT INTO bill_items
         (id,bill_id,item_id,qty,mrp,gst,purchase_price,discount)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [crypto.randomUUID(), finalBillId, itemId, i.qty, i.mrp, i.gst, pPrice, i.discount || 0]
      );

      await client.query(
        `INSERT INTO stock_batches (id,item_id,qty,purchase_price)
         VALUES ($1,$2,$3,$4)`,
        [crypto.randomUUID(), itemId, -i.qty, pPrice]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, billId: finalBillId });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Billing transaction error:", err);
    res.status(500).json({ error: "Failed to save bill" });
  } finally {
    client.release();
  }
});

// Print route for single bill (Issue 12)
router.get("/:id/print", requireAuth, async (req, res) => {
  try {
    const { rows: billRows } = await query(
      `SELECT * FROM bills WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.session.user.id]
    );
    const bill = billRows[0];
    if (!bill) return res.status(404).json({ error: "Bill not found" });

    const { rows: items } = await query(
      `SELECT bi.*, i.name, i.sku
       FROM bill_items bi
       JOIN items i ON i.id=bi.item_id
       WHERE bi.bill_id=$1`,
      [bill.id]
    );

    const normalizedItems = items.map(i => ({
      ...i,
      mrp: Number(i.mrp || i.price || 0),
      price: Number(i.price || i.mrp || 0),
      qty: Number(i.qty || 0),
      gst: Number(i.gst || 0),
      purchase_price: Number(i.purchase_price || 0),
      discount: Number(i.discount || 0)
    }));

    let totalDiscount = 0;
    for (const i of normalizedItems) {
      const itemGross = i.qty * i.mrp;
      totalDiscount += (itemGross * i.discount) / 100;
    }

    res.json({ 
      bill: { ...bill, total_discount: totalDiscount }, 
      items: normalizedItems,
      username: req.session.user.username 
    });
  } catch (err) {
    console.error("Print fetch error:", err);
    res.status(500).json({ error: "Failed to fetch print data" });
  }
});

// Delete bill with stock restoration
router.delete("/:id", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id: billId } = req.params;
    const userId = req.session.user.id;

    await client.query("BEGIN");

    // 1. Verify bill belongs to user
    const { rows: billRows } = await client.query(
      `SELECT id FROM bills WHERE id=$1 AND user_id=$2`,
      [billId, userId]
    );
    if (!billRows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Bill not found" });
    }

    // 2. Fetch all items to restore stock
    const { rows: items } = await client.query(
      `SELECT item_id, qty, purchase_price FROM bill_items WHERE bill_id=$1`,
      [billId]
    );

    // 3. Insert restoral batches
    for (const item of items) {
      await client.query(
        `INSERT INTO stock_batches (id, item_id, qty, purchase_price)
         VALUES ($1, $2, $3, $4)`,
        [crypto.randomUUID(), item.item_id, Number(item.qty), Number(item.purchase_price || 0)]
      );
    }

    // 4. Delete bill items and bill
    await client.query(`DELETE FROM bill_items WHERE bill_id=$1`, [billId]);
    await client.query(`DELETE FROM bills WHERE id=$1 AND user_id=$2`, [billId, userId]);

    await client.query("COMMIT");
    res.json({ success: true, message: "Bill deleted and stock restored" });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Delete bill error:", err);
    res.status(500).json({ error: "Failed to delete bill and restore stock" });
  } finally {
    client.release();
  }
});

// Print router (to be mounted separately or here)
const printRouter = express.Router();

printRouter.get("/bill/:id", requireAuth, async (req, res) => {
  try {
    const { rows: billRows } = await query(
      `SELECT * FROM bills WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.session.user.id]
    );
    const bill = billRows[0];
    if (!bill) return res.status(404).send("Bill not found");

    const { rows: items } = await query(
      `SELECT bi.*, i.name, i.sku
       FROM bill_items bi
       JOIN items i ON i.id=bi.item_id
       WHERE bi.bill_id=$1`,
      [bill.id]
    );
    
    const normalizedItems = items.map(i => ({
      ...i,
      mrp: Number(i.mrp),
      qty: Number(i.qty),
      gst: Number(i.gst),
      purchase_price: Number(i.purchase_price),
      discount: Number(i.discount || 0)
    }));

    let subtotal = 0;
    let discountTotal = 0;
    let gstTotal = 0;

    for (const i of normalizedItems) {
      const base = i.mrp * i.qty;
      const discount = base * (i.discount / 100);
      const taxable = base - discount;
      const gstPercent = i.gst / 100;
      
      // Since i.mrp is inclusive:
      // Real Gross = base
      // Net Gross = base - discount
      // Taxable = Net Gross / (1 + gstPercent)
      // GST Amount = Net Gross - Taxable
      
      const itemNetGross = base - discount;
      const itemTaxable = itemNetGross / (1 + gstPercent);
      const itemGst = itemNetGross - itemTaxable;

      subtotal += base;
      discountTotal += discount;
      gstTotal += itemGst;
    }

    const netTotal = subtotal - discountTotal;
    const cgst = gstTotal / 2;
    const sgst = gstTotal / 2;
    const grandTotal = netTotal;

    res.json({
      bill,
      items: normalizedItems,
      username: req.session.user.username,
      totals: { subtotal, discountTotal, netTotal, cgst, sgst, gstTotal, grandTotal }
    });
  } catch (err) {
    console.error("Print bill error:", err);
    res.status(500).send("Print error");
  }
});

// Export bills to CSV
router.get("/export", requireAuth, blockAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT invoice_no, customer_name, total, created_at 
       FROM bills 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.session.user.id]
    );

    let csv = "Invoice No,Customer,Total,Date\n";
    rows.forEach(r => {
      csv += `"${r.invoice_no}","${r.customer_name}",${r.total},"${new Date(r.created_at).toLocaleDateString()}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="bills-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error("Bills export error:", err);
    res.status(500).send("Export failed");
  }
});

export { printRouter };
export default router;
