import express from "express";
import crypto from "crypto";
import multer from "multer";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import cloudinary from "../cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all items with stock calculation
router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT i.*,
              COALESCE(SUM(sb.qty), 0) AS qty,
              COALESCE(
                SUM(CASE WHEN sb.qty > 0 THEN sb.qty * sb.purchase_price ELSE 0 END) / 
                NULLIF(SUM(CASE WHEN sb.qty > 0 THEN sb.qty ELSE 0 END), 0),
                0
              ) AS purchase_price,
              (i.mrp - COALESCE(
                SUM(CASE WHEN sb.qty > 0 THEN sb.qty * sb.purchase_price ELSE 0 END) / 
                NULLIF(SUM(CASE WHEN sb.qty > 0 THEN sb.qty ELSE 0 END), 0),
                0
              )) AS profit
       FROM items i
       LEFT JOIN stock_batches sb ON sb.item_id = i.id
       WHERE i.user_id = $1
       GROUP BY i.id
       ORDER BY i.created_at DESC`,
      [req.session.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Get items error:", err);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// Lookup items for billing (Issue 4)
router.get("/lookup", requireAuth, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  try {
    const { rows } = await query(
      `SELECT id, name, sku, mrp, gst 
       FROM items 
       WHERE user_id=$1 AND (LOWER(name) LIKE $2 OR LOWER(sku) LIKE $2)
       LIMIT 10`,
      [req.session.user.id, `%${String(q).toLowerCase()}%`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Lookup failed" });
  }
});

// Add new item with initial stock
router.post("/", requireAuth, async (req, res) => {
  const { name, sku, category, qty, purchase_price, mrp, gst, show_in_catalog } = req.body;

  if (!name || !sku || !category || qty === undefined || purchase_price === undefined || mrp === undefined || gst === undefined) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const itemId = crypto.randomUUID();
    const { rows: itemRows } = await query(
      `INSERT INTO items (id, user_id, name, sku, category, mrp, gst, show_in_catalog)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [itemId, req.session.user.id, name, sku, category, mrp, gst, !!show_in_catalog]
    );

    await query(
      `INSERT INTO stock_batches (id, item_id, qty, purchase_price)
       VALUES ($1,$2,$3,$4)`,
      [crypto.randomUUID(), itemId, qty, purchase_price]
    );

    res.json(itemRows[0]);
  } catch (err) {
    console.error("Add item error:", err);
    res.status(500).json({ error: "Failed to add item" });
  }
});

// Update item info
router.put("/:id", requireAuth, async (req, res) => {
  const { name, sku, category, mrp, gst } = req.body;
  try {
    await query(
      `UPDATE items SET name=$1, sku=$2, category=$3, mrp=$4, gst=$5
       WHERE id=$6 AND user_id=$7`,
      [name, sku, category, mrp, gst, req.params.id, req.session.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Update item error:", err);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// Delete item correctly
router.delete("/:id", requireAuth, async (req, res) => {
  const itemId = req.params.id;
  try {
    // 1. Delete image from Storage (ignore if fails)
    try {
      const { rows } = await query(`SELECT image_url FROM items WHERE id=$1 AND user_id=$2`, [itemId, req.session.user.id]);
      const imageUrl = rows[0]?.image_url;
      if (imageUrl) {
        if (imageUrl.startsWith("/uploads/")) {
          const filePath = path.join(__dirname, "..", "public", imageUrl);
          await fs.unlink(filePath).catch(e => console.warn("Local cleanup failed:", e));
        } else {
          await cloudinary.uploader.destroy(`inventopro/catalog/${itemId}`).catch(e => console.warn("Cloudinary cleanup failed:", e));
        }
      }
    } catch (err) {
      console.warn("Storage cleanup logic failed:", err.message);
    }

    // 2. Delete related records
    await query(`DELETE FROM stock_batches WHERE item_id=$1`, [itemId]);
    await query(`DELETE FROM bill_items WHERE item_id=$1`, [itemId]);
    await query(`DELETE FROM items WHERE id=$1 AND user_id=$2`, [itemId, req.session.user.id]);

    res.json({ success: true });
  } catch (err) {
    console.error("Delete item error:", err);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// Add stock batch
router.post("/:id/batch", requireAuth, async (req, res) => {
  const { qty, purchase_price } = req.body;
  try {
    await query(
      `INSERT INTO stock_batches (id, item_id, qty, purchase_price)
       VALUES ($1,$2,$3,$4)`,
      [crypto.randomUUID(), req.params.id, qty, purchase_price]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Batch add error:", err);
    res.status(500).json({ error: "Failed to add stock batch" });
  }
});

// Image upload
router.put("/:id/image-upload", requireAuth, upload.single("image"), async (req, res) => {
  try {
    const processedBuffer = await sharp(req.file.buffer)
      .resize(400, 300, { fit: "contain", background: "#ffffff" })
      .png({ quality: 80 })
      .toBuffer();

    let finalUrl = "";

    if (process.env.NODE_ENV === "production") {
      const result = await cloudinary.uploader.upload(
        `data:image/png;base64,${processedBuffer.toString("base64")}`,
        { folder: "inventopro/catalog", public_id: req.params.id, overwrite: true }
      );
      finalUrl = result.secure_url;
    } else {
      const uploadsDir = path.join(__dirname, "..", "public", "uploads", "catalog");
      await fs.mkdir(uploadsDir, { recursive: true });
      
      const fileName = `${req.params.id}.png`;
      const filePath = path.join(uploadsDir, fileName);
      await fs.writeFile(filePath, processedBuffer);
      
      finalUrl = `/uploads/catalog/${fileName}`;
    }

    await query(
      `UPDATE items SET image_url=$1 WHERE id=$2 AND user_id=$3`,
      [finalUrl, req.params.id, req.session.user.id]
    );

    res.json({ success: true, image_url: finalUrl });
  } catch (err) {
    console.error("Image upload failed:", err);
    res.status(500).json({ error: "Upload failed: " + (err.message || 'Unknown error') });
  }
});

// Remove image
router.delete("/:id/image-remove", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT image_url FROM items WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.session.user.id]
    );
    
    const imageUrl = rows[0]?.image_url;
    
    if (imageUrl) {
      if (imageUrl.startsWith("/uploads/")) {
        const filePath = path.join(__dirname, "..", "public", imageUrl);
        await fs.unlink(filePath).catch(e => console.warn("Local delete failed:", e));
      } else {
        await cloudinary.uploader.destroy(`inventopro/catalog/${req.params.id}`).catch(e => console.warn("Cloudinary delete failed:", e));
      }
    }

    await query(`UPDATE items SET image_url=NULL WHERE id=$1 AND user_id=$2`, [req.params.id, req.session.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Remove failed" });
  }
});

// Toggle catalog
router.put("/:id/catalog", requireAuth, async (req, res) => {
  try {
    await query(`UPDATE items SET show_in_catalog = NOT show_in_catalog WHERE id=$1 AND user_id=$2`, [req.params.id, req.session.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Toggle failed" });
  }
});

// Export items to CSV
router.get("/export", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT i.name, i.sku, i.category, i.mrp, i.gst, 
              COALESCE(SUM(sb.qty), 0) AS stock
       FROM items i
       LEFT JOIN stock_batches sb ON sb.item_id = i.id
       WHERE i.user_id = $1
       GROUP BY i.id
       ORDER BY i.name ASC`,
      [req.session.user.id]
    );

    let csv = "Name,SKU,Category,MRP,GST %,Current Stock\n";
    rows.forEach(r => {
      csv += `"${r.name}","${r.sku}","${r.category}",${r.mrp},${r.gst},${r.stock}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="inventory-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).send("Export failed");
  }
});

export default router;
