import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false
});

export const query = (text, params = []) =>
  pool.query(text, params);

export async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      name TEXT NOT NULL,
      sku TEXT NOT NULL,
      category TEXT,
      mrp NUMERIC DEFAULT 0,
      gst NUMERIC DEFAULT 0,
      image_url TEXT,
      show_in_catalog BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_batches (
      id TEXT PRIMARY KEY,
      item_id TEXT REFERENCES items(id),
      qty INTEGER NOT NULL,
      purchase_price NUMERIC DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      invoice_no TEXT NOT NULL,
      customer_name TEXT,
      customer_phone TEXT,
      customer_gst TEXT,
      customer_address TEXT,
      subtotal NUMERIC DEFAULT 0,
      gst NUMERIC DEFAULT 0,
      total NUMERIC DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bill_items (
      id TEXT PRIMARY KEY,
      bill_id TEXT REFERENCES bills(id),
      item_id TEXT REFERENCES items(id),
      qty INTEGER,
      mrp NUMERIC,
      gst NUMERIC,
      purchase_price NUMERIC,
      discount NUMERIC DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS invoice_seq (
      year INTEGER PRIMARY KEY,
      last_number INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS session (
  sid varchar PRIMARY KEY,
  sess json NOT NULL,
  expire timestamp NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);
  `);
}