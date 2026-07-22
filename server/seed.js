import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "./db.js";

async function upsertUser(username, password, role) {
  if (!username || !password) {
    console.log(`Skipping ${role}: no username/password set in .env`);
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (username, password_hash, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (username) DO UPDATE SET password_hash = $2, role = $3`,
    [username, hash, role]
  );
  console.log(`Seeded ${role} user "${username}"`);
}

async function main() {
  await upsertUser(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD, "admin");
  await upsertUser(process.env.VIEWER_USERNAME, process.env.VIEWER_PASSWORD, "viewer");
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
