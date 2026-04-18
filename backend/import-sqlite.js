import sqlite3 from "sqlite3";
import crypto from "crypto";
import { pool } from "./db.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlitePath = path.join(__dirname, "invento.db");
const db = new sqlite3.Database(sqlitePath);

async function migrate() {
  console.log("Starting migration from SQLite to Postgres...");

  // 1. Migrate Users
  const users = await new Promise((resolve, reject) => {
    db.all("SELECT * FROM users", (err, rows) => err ? reject(err) : resolve(rows));
  });

  const userMap = {}; // old_id -> new_id
  for (const u of users) {
    const newId = crypto.randomUUID();
    userMap[u.id] = newId;
    await pool.query(
      "INSERT INTO users(id, username, email, password, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING",
      [newId, u.username || u.name, u.email, u.password, u.role || 'user']
    );
  }
  console.log(`Migrated ${users.length} users.`);

  // Fallback user if none migrated
  let defaultUserId = Object.values(userMap)[0];
  if (!defaultUserId) {
    defaultUserId = crypto.randomUUID();
    await pool.query(
      "INSERT INTO users(id, username, email, password, role) VALUES ($1, $2, $3, $4, $5)",
      [defaultUserId, 'admin', 'admin@example.com', 'admin123', 'admin']
    );
    console.log("Created default admin user.");
  }

  // 2. Migrate Inventory to Items + Stock Batches
  const inventory = await new Promise((resolve, reject) => {
    db.all("SELECT * FROM inventory", (err, rows) => err ? reject(err) : resolve(rows));
  });

  for (const i of inventory) {
    const itemId = crypto.randomUUID();
    // Use default values for missing columns
    const mrp = Number(i.price) || 0;
    const qty = Number(i.quantity) || 0;
    const gst = 0; // Default GST if not in SQLite

    await pool.query(
      `INSERT INTO items (id, user_id, name, sku, category, mrp, gst)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [itemId, defaultUserId, i.name, i.sku || `SKU-${itemId.slice(0,8)}`, i.category || 'General', mrp, gst]
    );

    // Create initial stock batch
    await pool.query(
      `INSERT INTO stock_batches (id, item_id, qty, purchase_price)
       VALUES ($1, $2, $3, $4)`,
      [crypto.randomUUID(), itemId, qty, mrp * 0.7] // Assume 30% margin for purchase price if missing
    );
  }
  console.log(`Migrated ${inventory.length} items to new schema.`);

  console.log("Migration complete!");
}

migrate()
  .catch(err => console.error("Migration failed:", err))
  .finally(() => {
    db.close();
    pool.end();
  });
