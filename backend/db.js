import pkg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const { Pool, Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });
dotenv.config({ quiet: true });

const targetDb = process.env.PGDATABASE || "invento";

const ensureString = (val) => String(val ?? "");
const isTruthy = (val) => ["1", "true", "yes", "on"].includes(String(val ?? "").toLowerCase());

function resolveSslConfig(connectionUrl) {
  const sslMode = connectionUrl?.searchParams.get("sslmode");

  if (isTruthy(process.env.DB_SSL)) {
    return { rejectUnauthorized: false };
  }

  if (sslMode && sslMode !== "disable") {
    return { rejectUnauthorized: false };
  }

  if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
    return { rejectUnauthorized: false };
  }

  return false;
}

let poolConfig;

if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: resolveSslConfig(url)
  };
} else {
  poolConfig = {
    host: ensureString(process.env.PGHOST) || "localhost",
    port: Number(process.env.PGPORT || 5432),
    user: ensureString(process.env.PGUSER) || "postgres",
    password: ensureString(process.env.PGPASSWORD),
    database: targetDb,
    ssl: resolveSslConfig(),
  };
}

export const pool = new Pool(poolConfig);
export const query = (text, params = []) => pool.query(text, params);

async function bootstrapDatabase() {
  if (process.env.DATABASE_URL) {
    return;
  }

  const bootstrapConfig = { ...poolConfig, database: "postgres" };
  const client = new Client(bootstrapConfig);
  
  try {
    await client.connect();
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [targetDb]);
    
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE ${targetDb}`);
    }
  } catch (err) {
    console.warn("Database bootstrap warning:", err.message);
  } finally {
    await client.end();
  }
}

export async function initDb() {
  try {
    // Try to ensure the database exists first
    await bootstrapDatabase();

    await pool.query("SELECT 1");

    // 1. Create Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(100) UNIQUE,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user',
        status VARCHAR(20) DEFAULT 'Active',
        last_login_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        phone VARCHAR(20) UNIQUE,
        current_fy VARCHAR(20) DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY')
      );

      CREATE TABLE IF NOT EXISTS session (
        sid varchar NOT NULL COLLATE "default",
        sess json NOT NULL,
        expire timestamp(6) NOT NULL,
        CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
      ) WITH (OIDS=FALSE);
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON session (expire);

      CREATE TABLE IF NOT EXISTS items (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id),
        name VARCHAR(255),
        sku VARCHAR(100),
        category VARCHAR(100),
        mrp DECIMAL(10,2),
        gst DECIMAL(10,2),
        image_url TEXT,
        show_in_catalog BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS stock_batches (
        id VARCHAR(255) PRIMARY KEY,
        item_id VARCHAR(255) REFERENCES items(id),
        qty DECIMAL(10,2),
        purchase_price DECIMAL(10,2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bills (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id),
        invoice_no VARCHAR(50),
        customer_name VARCHAR(255),
        customer_phone VARCHAR(20),
        customer_email VARCHAR(255),
        customer_gst VARCHAR(20),
        customer_address TEXT,
        customer_state VARCHAR(100),
        subtotal DECIMAL(10,2),
        total DECIMAL(10,2),
        average_purchase_price DECIMAL(10,2) DEFAULT 0,
        fy_year VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bill_items (
        id VARCHAR(255) PRIMARY KEY,
        bill_id VARCHAR(255) REFERENCES bills(id),
        item_id VARCHAR(255) REFERENCES items(id),
        name VARCHAR(255),
        qty DECIMAL(10,2),
        mrp DECIMAL(10,2),
        gst DECIMAL(10,2),
        purchase_price DECIMAL(10,2) DEFAULT 0,
        discount DECIMAL(10,2) DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS invoice_seq (
        user_id VARCHAR(255) REFERENCES users(id),
        year_label VARCHAR(20),
        last_number INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, year_label)
      );
    `);

    // 2. Migration: Add missing columns if tables already existed from old versions
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
          ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'Active';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login_at') THEN
          ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='created_at') THEN
          ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone') THEN
          ALTER TABLE users ADD COLUMN phone VARCHAR(20) UNIQUE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bills' AND column_name='customer_email') THEN
          ALTER TABLE bills ADD COLUMN customer_email VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bills' AND column_name='customer_state') THEN
          ALTER TABLE bills ADD COLUMN customer_state VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bills' AND column_name='customer_phone') THEN
          ALTER TABLE bills ADD COLUMN customer_phone VARCHAR(20);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bills' AND column_name='customer_gst') THEN
          ALTER TABLE bills ADD COLUMN customer_gst VARCHAR(20);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bills' AND column_name='customer_address') THEN
          ALTER TABLE bills ADD COLUMN customer_address TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bills' AND column_name='average_purchase_price') THEN
          ALTER TABLE bills ADD COLUMN average_purchase_price DECIMAL(10,2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bill_items' AND column_name='discount') THEN
          ALTER TABLE bill_items ADD COLUMN discount DECIMAL(10,2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bill_items' AND column_name='purchase_price') THEN
          ALTER TABLE bill_items ADD COLUMN purchase_price DECIMAL(10,2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='current_fy') THEN
          ALTER TABLE users ADD COLUMN current_fy VARCHAR(20) DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bills' AND column_name='fy_year') THEN
          ALTER TABLE bills ADD COLUMN fy_year VARCHAR(20);
          UPDATE bills SET fy_year = TO_CHAR(created_at, 'YYYY') WHERE fy_year IS NULL;
        END IF;
        
        -- Migrate invoice_seq if it still uses the old schema (no user_id column)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_seq' AND column_name='user_id') THEN
          DROP TABLE IF EXISTS invoice_seq;
          CREATE TABLE invoice_seq (
            user_id VARCHAR(255) REFERENCES users(id),
            year_label VARCHAR(20),
            last_number INTEGER DEFAULT 0,
            PRIMARY KEY (user_id, year_label)
          );
        END IF;
      END $$;
    `);
  } catch (err) {
    console.error("Database connection/init error:", err);
    throw err;
  }
}
