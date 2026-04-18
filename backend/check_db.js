import { pool } from "./db.js";

async function check() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tables:", res.rows.map(r => r.table_name));
    
    for (const table of res.rows) {
      const cols = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [table.table_name]);
      console.log(`Columns for ${table.table_name}:`, cols.rows.map(c => `${c.column_name} (${c.data_type})`));
    }
  } catch (err) {
    console.error("DB check failed:", err);
  } finally {
    await pool.end();
  }
}

check();
