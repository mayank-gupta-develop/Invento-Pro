import "dotenv/config";
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import crypto from "crypto";
import multer from "multer";
import fs from "fs";
import sharp from "sharp";
import { query, initDb } from "./db.js";
import pgSession from "connect-pg-simple";
import pkg from "pg";
import cloudinary from "./cloudinary.js";


/* ================= SETUP ================= */
console.log("DATABASE_URL =", process.env.DATABASE_URL);
const { Pool } = pkg;

const PgSession = pgSession(session);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const APP_NAME = "Invento Pro";

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new PgSession({
      pool: pool,          
      tableName: "session"
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 
    }
  })
);

function validatePassword(password) {
  if (!password || password.length < 10) {
    return "Password must be at least 10 characters long";
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return "Password must contain letters and numbers";
  }

  return null; // ✅ valid
}
/* ================= REQUEST COUNTER ================= */

let requestCount = 0;
setInterval(() => (requestCount = 0), 60000);

app.use((req, res, next) => {
  requestCount++;
  next();
});

/* ================= VIEW SETUP ================= */

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use((req, res, next) => {
  res.locals.appName = APP_NAME;
  res.locals.currentUser = req.session.user || null;
  next();
});
app.set("trust proxy", 1);

/* ================= AUTH HELPERS ================= */

const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.redirect("/login");
  next();
};

const blockAdmin = (req, res, next) => {
  if (req.session.user?.role === "admin") return res.redirect("/admin");
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("Access denied");
  }
  next();
};

/* ================= AUTH ================= */

app.get("/login", (_req, res) => res.render("login", { error: null }));

app.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  const { rows } = await query(
    `SELECT * FROM users
     WHERE username=$1 OR email=$1 OR phone=$1`,
    [identifier]
  );

  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.render("login", { error: "Invalid credentials" });
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role || "user"
  };

  res.redirect(user.role === "admin" ? "/admin" : "/inventory");
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

/* ================= SIGNUP ================= */
app.get("/signup", (_req, res) =>
  res.render("signup", { errors: null })
);
app.post("/signup", async (req, res) => {
  const { username, email, phone, password } = req.body;

  // 🔐 Password validation (see section 2)
  const pwdError = validatePassword(password);
  if (pwdError) {
    return res.render("signup", {
      errors: { general: pwdError }
    });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    await query(
      `INSERT INTO users (id, username, email, phone, password)
       VALUES ($1,$2,$3,$4,$5)`,
      [crypto.randomUUID(), username, email || null, phone || null, hash]
    );

    res.redirect("/login");
  } catch (err) {
    // 🟥 PostgreSQL unique violation
    if (err.code === "23505") {
      let message = "Account already exists";

      if (err.constraint?.includes("username")) {
        message = "Username already taken";
      } else if (err.constraint?.includes("email")) {
        message = "Email already registered";
      } else if (err.constraint?.includes("phone")) {
        message = "Phone number already registered";
      }

      return res.render("signup", {
        errors: { general: message }
      });
    }

    console.error(err);
    res.render("signup", {
      errors: { general: "Something went wrong. Try again." }
    });
  }
});

/* ================= PAGES ================= */


app.get("/", (_req, res) => res.redirect("/inventory"));
app.get("/inventory", requireAuth, blockAdmin, (_req, res) =>
  res.render("inventory")
);
app.get("/catalog", requireAuth, blockAdmin, (_req, res) =>
  res.render("catalog")
);
app.get("/billing", requireAuth, blockAdmin, (_req, res) =>
  res.render("billing")
);

/* ================= BILLS ================= */

app.get("/bills", requireAuth, blockAdmin, async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM bills
     WHERE user_id=$1
     ORDER BY created_at DESC`,
    [req.session.user.id]
  );

  const normalizedBills = rows.map(b => ({
    ...b,
    subtotal: Number(b.subtotal),
    total: Number(b.total)
  }));

  res.render("bills", { bills: normalizedBills });
});

/* ================= ADMIN ================= */

app.get("/admin", requireAuth, requireAdmin, async (_, res) => {
  const { rows } = await query(
    `SELECT id, username, email, phone, role, created_at
     FROM users
     ORDER BY created_at DESC`
  );
  res.render("admin", { users: rows });
});

app.delete("/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const userId = req.params.id;
  if (userId === req.session.user.id)
    return res.status(400).json({ error: "You cannot delete yourself" });

  await query(`DELETE FROM bill_items WHERE bill_id IN (SELECT id FROM bills WHERE user_id=$1)`, [userId]);
  await query(`DELETE FROM bills WHERE user_id=$1`, [userId]);
  await query(`DELETE FROM stock_batches WHERE item_id IN (SELECT id FROM items WHERE user_id=$1)`, [userId]);
  await query(`DELETE FROM items WHERE user_id=$1`, [userId]);
  await query(`DELETE FROM users WHERE id=$1`, [userId]);

  res.json({ success: true });
});

/* ================= IMAGE UPLOAD ================= */


const upload = multer({ storage: multer.memoryStorage() });

app.put(
  "/api/items/:id/image-upload",
  requireAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      // 1️⃣ Process image with sharp
      const processedBuffer = await sharp(req.file.buffer)
        .resize(400, 300, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png({ quality: 80 })
        .toBuffer();

      // 2️⃣ Upload to Cloudinary
      const result = await cloudinary.uploader.upload(
        `data:image/png;base64,${processedBuffer.toString("base64")}`,
        {
          folder: "inventopro/catalog",
          public_id: req.params.id,
          overwrite: true,
        }
      );

      // 3️⃣ Save URL in DB
      await query(
        `UPDATE items SET image_url=$1 WHERE id=$2 AND user_id=$3`,
        [result.secure_url, req.params.id, req.session.user.id]
      );

      res.json({
        success: true,
        image_url: result.secure_url,
      });
    } catch (err) {
      console.error("Image upload failed:", err);
      res.status(500).json({ error: "Image upload failed" });
    }
  }
);
/* ================= SALES REPORT ================= */
app.get("/sales", requireAuth, blockAdmin, async (req, res) => {
  const { date, sort, q } = req.query;

  let conditions = [`b.user_id = $1`];
  let params = [req.session.user.id];
  let idx = 2;

  // 📅 Date filter
  if (date) {
    conditions.push(`DATE(b.created_at) = $${idx}`);
    params.push(date);
    idx++;
  }

  // 🔍 Customer search
  if (q) {
    conditions.push(`LOWER(b.customer_name) LIKE $${idx}`);
    params.push(`%${q.toLowerCase()}%`);
    idx++;
  }

  // ↕ Sorting
  let orderBy = "b.created_at DESC";
  if (sort === "customer") {
    orderBy = "b.customer_name ASC";
  }

  const sql = `
    SELECT
      b.id AS bill_id,
      b.invoice_no,
      b.customer_name,
      b.created_at,
      SUM(bi.qty) AS qty,
      SUM(bi.qty * bi.mrp) AS line_total,
      b.total AS bill_total
    FROM bills b
    JOIN bill_items bi ON bi.bill_id = b.id
    WHERE ${conditions.join(" AND ")}
    GROUP BY b.id
    ORDER BY ${orderBy}
  `;

  const { rows } = await query(sql, params);

  const summary = {
    bills: rows.length,
    subtotal: rows.reduce((s, r) => s + Number(r.line_total), 0),
    gst: 0,
    total: rows.reduce((s, r) => s + Number(r.bill_total), 0)
  };

  const normalizedRows = rows.map(r => ({
  ...r,
  qty: Number(r.qty),
  line_total: Number(r.line_total),
  bill_total: Number(r.bill_total)
}));

res.render("sales", {
  rows: normalizedRows,
  summary,
  filters: { date, sort, q }
});
});
/* ================= SALES CSV EXPORT ================= */
app.get("/sales/export", requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT
  b.id AS bill_id,
  b.invoice_no,
  b.customer_name,
  b.created_at,
  SUM(bi.qty) AS qty,
  SUM(bi.qty * bi.mrp) AS line_total,
  b.total AS bill_total
FROM bills b
JOIN bill_items bi ON bi.bill_id=b.id
WHERE b.user_id=$1
GROUP BY b.id
ORDER BY b.created_at DESC`,
    [req.session.user.id]
  );

  let csv = "Invoice,Date,Customer,Qty,Line Total,Bill Total\n";
  rows.forEach(r => {
    csv += `"${r.invoice_no}","${new Date(r.created_at).toLocaleDateString()}","${r.customer_name || ""}",${r.qty},${r.line_total},${r.bill_total}\n`;
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="sales-${Date.now()}.csv"`);
  res.send(csv);
});
// ================= ADMIN USER EXPORT + PRINT =================

app.get("/admin/users/export", requireAuth, requireAdmin, async (req, res) => {
  const q = (req.query.q || "").toLowerCase();

  const sql = `
    SELECT username,email,phone,role,created_at
    FROM users
    WHERE
      LOWER(username) LIKE $1 OR
      LOWER(email) LIKE $1 OR
      phone LIKE $1
    ORDER BY created_at DESC
  `;

  const { rows: users } = await query(sql, [`%${q}%`]);

  let csv = "Username,Email,Phone,Role,Created At\n";
  users.forEach(u => {
    csv += `"${u.username}","${u.email || ""}","${u.phone || ""}","${u.role}","${u.created_at}"\n`;
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="users-${Date.now()}.csv"`);
  res.send(csv);
});

app.get("/admin/users/print", requireAuth, requireAdmin, async (req, res) => {
  const q = (req.query.q || "").toLowerCase();

  const sql = `
    SELECT username,email,phone,role,created_at
    FROM users
    WHERE
      LOWER(username) LIKE $1 OR
      LOWER(email) LIKE $1 OR
      phone LIKE $1
    ORDER BY created_at DESC
  `;

  const { rows: users } = await query(sql, [`%${q}%`]);

  res.render("admin-print", { users });
});
/* ================= INVENTORY API ================= */

app.get("/api/items", requireAuth, async (req, res) => {
  const { rows } = await query(
    `
    SELECT
  i.*,
  COALESCE(SUM(sb.qty), 0) AS qty,
  COALESCE(
    SUM(
      CASE WHEN sb.qty > 0 THEN sb.qty * sb.purchase_price ELSE 0 END
    ) /
    NULLIF(
      SUM(CASE WHEN sb.qty > 0 THEN sb.qty ELSE 0 END),
      0
    ),
    0
  ) AS purchase_price
FROM items i
LEFT JOIN stock_batches sb ON sb.item_id = i.id
WHERE i.user_id = $1
GROUP BY i.id
ORDER BY i.created_at DESC;
    `,
    [req.session.user.id]
  );

  res.json(rows);
});
/* ===== ADD ITEM + INITIAL STOCK ===== */

app.post("/api/items", requireAuth, async (req, res) => {
  const { name, sku, category, qty, purchase_price, mrp, gst, show_in_catalog } = req.body;

  // ❌ VALIDATION
  if (
    !name ||
    !sku ||
    !category ||
    qty === undefined ||
    purchase_price === undefined ||
    mrp === undefined ||
    gst === undefined
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (qty <= 0 || purchase_price <= 0 || mrp <= 0) {
    return res.status(400).json({ error: "Numeric values must be greater than 0" });
  }

  const itemId = crypto.randomUUID();

  await query(
    `INSERT INTO items (id,user_id,name,sku,category,mrp,gst,show_in_catalog)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [itemId, req.session.user.id, name, sku, category, mrp, gst, !!show_in_catalog]
  );

  await query(
    `INSERT INTO stock_batches (id,item_id,qty,purchase_price)
     VALUES ($1,$2,$3,$4)`,
    [crypto.randomUUID(), itemId, qty, purchase_price]
  );

  res.json({ success: true });
});

// ===== UPDATE ITEM INFO =====
app.put("/api/items/:id", requireAuth, async (req, res) => {
  const { name, sku, category, mrp, gst } = req.body;

  await query(
    `
    UPDATE items
    SET name=$1,
        sku=$2,
        category=$3,
        mrp=$4,
        gst=$5
    WHERE id=$6 AND user_id=$7
    `,
    [
      name,
      sku,
      category,
      mrp,
      gst,
      req.params.id,
      req.session.user.id
    ]
  );

  res.json({ success: true });
});
/* ===== ADD STOCK BATCH ===== */

app.post("/api/items/:id/batch", requireAuth, async (req, res) => {
  const { qty, purchase_price } = req.body;

  await query(
    `INSERT INTO stock_batches (id,item_id,qty,purchase_price)
     VALUES ($1,$2,$3,$4)`,
    [crypto.randomUUID(), req.params.id, qty, purchase_price]
  );

  res.json({ success: true });
});

/* ===== DELETE ITEM (SAFE) ===== */

app.delete("/api/items/:id", requireAuth, async (req, res) => {
  const itemId = req.params.id;

  // 🔥 1. Delete image from Cloudinary
  try {
    await cloudinary.uploader.destroy(`inventopro/catalog/${itemId}`);
  } catch (err) {
    console.warn("Cloudinary image delete failed:", err.message);
    // DO NOT block deletion if image missing
  }

  // 🔥 2. Delete DB records
  await query(`DELETE FROM stock_batches WHERE item_id=$1`, [itemId]);
  await query(`DELETE FROM bill_items WHERE item_id=$1`, [itemId]);
  await query(
    `DELETE FROM items WHERE id=$1 AND user_id=$2`,
    [itemId, req.session.user.id]
  );

  res.json({ success: true });
});
/* ===== CATALOG API ===== */

app.get("/api/catalog", requireAuth, async (req, res) => {
  const { rows } = await query(`
    SELECT i.*,
           COALESCE(SUM(sb.qty),0) AS qty
    FROM items i
    LEFT JOIN stock_batches sb ON sb.item_id=i.id
    WHERE i.user_id=$1
    GROUP BY i.id
  `, [req.session.user.id]);

  res.json(rows);
});

app.delete("/api/items/:id/image-remove", requireAuth, async (req, res) => {
  const { id } = req.params;

  const { rows } = await query(
    `SELECT image_url FROM items WHERE id=$1 AND user_id=$2`,
    [id, req.session.user.id]
  );

  if (!rows[0]?.image_url) {
    return res.json({ success: true });
  }

  await query(
    `UPDATE items SET image_url=NULL WHERE id=$1 AND user_id=$2`,
    [id, req.session.user.id]
  );

  res.json({ success: true });
});
/* ===== TOGGLE CATALOG ===== */

app.put("/api/items/:id/catalog", requireAuth, async (req, res) => {
  await query(
    `UPDATE items
     SET show_in_catalog = NOT show_in_catalog
     WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.session.user.id]
  );
  res.json({ success: true });
});

/* ================= BILLING ================= */

async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const { rows } = await query(`SELECT last_number FROM invoice_seq WHERE year=$1`, [year]);
  const next = rows.length ? rows[0].last_number + 1 : 1;

  if (rows.length)
    await query(`UPDATE invoice_seq SET last_number=$1 WHERE year=$2`, [next, year]);
  else
    await query(`INSERT INTO invoice_seq (year,last_number) VALUES ($1,$2)`, [year, next]);

  return `INV-${year}-${String(next).padStart(4, "0")}`;
}
/* ===== ITEM LOOKUP FOR BILLING ===== */
app.get("/api/items/lookup", requireAuth, async (req, res) => {
  const q = (req.query.q || "").trim().toLowerCase();
  const { rows } = await query(
  `SELECT
     i.id, i.name, i.sku, i.mrp, i.gst,
     COALESCE(
       ROUND(SUM(sb.qty * sb.purchase_price) / NULLIF(SUM(sb.qty),0),2),
       0
     ) AS purchase_price
   FROM items i
   LEFT JOIN stock_batches sb ON sb.item_id=i.id
   WHERE i.user_id=$1
     AND (LOWER(i.name)=$2 OR LOWER(i.sku)=$2)
   GROUP BY i.id
   LIMIT 1`,
  [req.session.user.id, q]
);

const item = rows[0];
if (!item) return res.json(null);
res.json(item);
});
/* ===== CREATE / EDIT BILL ===== */

app.post("/api/billing", requireAuth, async (req, res) => {
  const { billId, items, customer_name, customer_phone, customer_gst, customer_address } = req.body;

  let subtotal = 0;
  let discountTotal = 0;

  for (const i of items) {
    const base = i.mrp * i.qty;
    subtotal += base;
    discountTotal += base * ((i.discount || 0) / 100);
  }

  const total = subtotal - discountTotal;

  let finalBillId = billId;
  let invoiceNo;

  if (!billId) {
    finalBillId = crypto.randomUUID();
    invoiceNo = await generateInvoiceNumber();

    await query(
      `INSERT INTO bills
       (id,user_id,invoice_no,customer_name,customer_phone,customer_gst,customer_address,subtotal,total)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        finalBillId,
        req.session.user.id,
        invoiceNo,
        customer_name,
        customer_phone,
        customer_gst,
        customer_address,
        subtotal,
        total
      ]
    );
  } else {
    const { rows } = await query(
      `SELECT * FROM bills WHERE id=$1 AND user_id=$2`,
      [billId, req.session.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Bill not found" });

    await query(`DELETE FROM bill_items WHERE bill_id=$1`, [billId]);
  }

  for (const i of items) {
    await query(
      `INSERT INTO bill_items
       (id,bill_id,item_id,qty,mrp,gst,purchase_price,discount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        crypto.randomUUID(),
        finalBillId,
        i.id,
        i.qty,
        i.mrp,
        i.gst,
        i.purchase_price,
        i.discount || 0
      ]
    );

    await query(
      `INSERT INTO stock_batches
       (id,item_id,qty,purchase_price)
       VALUES ($1,$2,$3,$4)`,
      [crypto.randomUUID(), i.id, -i.qty, i.purchase_price]
    );
  }

  res.json({ success: true, billId: finalBillId });
});
app.get("/api/billing/:id", requireAuth, async (req, res) => {
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
});

app.get("/billing/print/:id", requireAuth, async (req, res) => {
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
    const discount = base * ((i.discount || 0) / 100);
    const taxable = base - discount;
    const gst = taxable * (i.gst / 100);

    subtotal += base;
    discountTotal += discount;
    gstTotal += gst;
  }

  const netTotal = subtotal - discountTotal;
  const cgst = gstTotal / 2;
  const sgst = gstTotal / 2;
  const grandTotal = netTotal + gstTotal;

  const template = items.length > 10 ? "bill-print-a4" : "bill-print-a5";

 res.render(template, {
  bill,
  items: normalizedItems,
  username: req.session.user.username,
  totals: {
    subtotal,
    discountTotal,
    netTotal,
    cgst,
    sgst,
    gstTotal,
    grandTotal
  }
});
});
app.get("/billing/edit/:id", requireAuth, (req, res) => {
  res.redirect(`/billing?edit=${req.params.id}`);
});
app.delete("/api/billing/:id", requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM bills WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.session.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Bill not found" });

  await query(`DELETE FROM bill_items WHERE bill_id=$1`, [req.params.id]);
  await query(`DELETE FROM bills WHERE id=$1`, [req.params.id]);

  res.json({ success: true });
});

/* ================= START SERVER ================= */

(async () => {
  try {
    await initDb(); 

    app.listen(PORT, () => {
      const host =
        process.env.NODE_ENV === "production"
          ? "https://your-render-app.onrender.com"
          : `http://localhost:${PORT}`;

      console.log(`✅ ${APP_NAME} running`);
      console.log(`🌐 App URL: ${host}`);
    });

  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
})();