import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Keep small: on Vercel each serverless instance gets its own pool, and the
  // Neon "-pooler" endpoint already multiplexes connections via PgBouncer.
  max: 5,
});
