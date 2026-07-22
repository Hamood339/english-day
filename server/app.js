import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { pool } from "./db.js";
import {
  signToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
  requireAdmin,
} from "./auth.js";

const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function toDateKey(value) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

async function getState() {
  const { rows } = await pool.query(`SELECT * FROM app_state WHERE id = true`);
  if (rows[0]) return rows[0];
  const inserted = await pool.query(
    `INSERT INTO app_state (id, current_day) VALUES (true, $1) RETURNING *`,
    [todayKey()]
  );
  return inserted.rows[0];
}

async function getSessionPayload() {
  const state = await getState();
  const { rows: members } = await pool.query(
    `SELECT id, name, mistakes FROM members ORDER BY id ASC`
  );
  return {
    date: toDateKey(state.current_day),
    soundEnabled: state.sound_enabled,
    penaltyAmount: state.penalty_amount,
    topPenaltyAmount: state.top_penalty_amount,
    members,
  };
}

/**
 * Snapshots every member's current tally into day_history before it gets reset.
 * Whoever has the most mistakes that day (ties all count) also gets the flat
 * top_penalty_amount fine on top of their per-mistake total.
 */
async function archiveCurrentDay(date) {
  await pool.query(
    `INSERT INTO day_history
       (date, member_id, member_name, mistakes, penalty_amount, is_top_offender, extra_penalty)
     SELECT $1, m.id, m.name, m.mistakes, s.penalty_amount,
            (maxm.max_mistakes > 0 AND m.mistakes = maxm.max_mistakes),
            CASE WHEN maxm.max_mistakes > 0 AND m.mistakes = maxm.max_mistakes
                 THEN s.top_penalty_amount ELSE 0 END
     FROM members m
     CROSS JOIN (SELECT COALESCE(MAX(mistakes), 0) AS max_mistakes FROM members) maxm
     CROSS JOIN (SELECT penalty_amount, top_penalty_amount FROM app_state WHERE id = true) s`,
    [date]
  );
}

/** Archives the current day (designating the top offender) and zeroes tallies. */
async function closeDay() {
  const state = await getState();
  await archiveCurrentDay(toDateKey(state.current_day));
  await pool.query(`UPDATE members SET mistakes = 0`);
  await pool.query(`UPDATE app_state SET current_day = $1 WHERE id = true`, [todayKey()]);
}

// --- Auth ---
// Routes are intentionally flat (no /api/auth/... nesting) — this Vercel
// project's filesystem function routing does not reliably invoke functions
// for files nested in subfolders, only ones directly under /api.
app.post("/api/auth-login", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  const { rows } = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  setAuthCookie(res, signToken(user));
  res.json({ username: user.username, role: user.role });
});

app.post("/api/auth-logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.get("/api/auth-me", requireAuth, (req, res) => {
  res.json({ username: req.user.username, role: req.user.role });
});

// --- Session (shared, live "today") — public, no login needed to view ---
app.get("/api/session", async (req, res) => {
  res.json(await getSessionPayload());
});

app.post("/api/session-sound", requireAuth, requireAdmin, async (req, res) => {
  const { enabled } = req.body ?? {};
  await pool.query(`UPDATE app_state SET sound_enabled = $1 WHERE id = true`, [!!enabled]);
  res.json(await getSessionPayload());
});

// Closes the books on the current day: archives it to history, then zeroes
// every mistake count and moves the shared cursor to today.
app.post("/api/session-reset", requireAuth, requireAdmin, async (req, res) => {
  await closeDay();
  res.json(await getSessionPayload());
});

// Called when the calendar day has changed since the last visit.
// keepScores=false archives + resets tallies; keepScores=true just moves the cursor.
app.post("/api/session-new-day", requireAuth, requireAdmin, async (req, res) => {
  const { keepScores } = req.body ?? {};
  if (!keepScores) {
    await closeDay();
  } else {
    await pool.query(`UPDATE app_state SET current_day = $1 WHERE id = true`, [todayKey()]);
  }
  res.json(await getSessionPayload());
});

// Triggered by Vercel Cron at 16:30 daily: automatically closes the day so
// whoever has the most mistakes is locked in as the one owing the top fine.
app.get("/api/cron-close-day", async (req, res) => {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  await closeDay();
  res.json({ ok: true, closedAt: new Date().toISOString() });
});

// --- Members (persistent roster) — id passed as ?id= to keep every route flat ---
app.post("/api/members", requireAuth, requireAdmin, async (req, res) => {
  const { name } = req.body ?? {};
  if (!name?.trim()) return res.status(400).json({ error: "Name required" });
  await pool.query(`INSERT INTO members (name) VALUES ($1)`, [name.trim()]);
  res.json(await getSessionPayload());
});

app.patch("/api/member", requireAuth, requireAdmin, async (req, res) => {
  const { name } = req.body ?? {};
  if (!name?.trim()) return res.status(400).json({ error: "Name required" });
  await pool.query(`UPDATE members SET name = $1 WHERE id = $2`, [name.trim(), req.query.id]);
  res.json(await getSessionPayload());
});

app.delete("/api/member", requireAuth, requireAdmin, async (req, res) => {
  await pool.query(`DELETE FROM members WHERE id = $1`, [req.query.id]);
  res.json(await getSessionPayload());
});

app.post("/api/member-mistake", requireAuth, requireAdmin, async (req, res) => {
  await pool.query(`UPDATE members SET mistakes = mistakes + 1 WHERE id = $1`, [req.query.id]);
  res.json(await getSessionPayload());
});

app.post("/api/member-undo", requireAuth, requireAdmin, async (req, res) => {
  await pool.query(
    `UPDATE members SET mistakes = GREATEST(mistakes - 1, 0) WHERE id = $1`,
    [req.query.id]
  );
  res.json(await getSessionPayload());
});

// --- Summary: total collected today + how much each person currently owes ---
// Public — anyone can see the live scores and penalties without logging in.
app.get("/api/summary", async (req, res) => {
  const session = await getSessionPayload();
  const maxMistakes = session.members.reduce((max, m) => Math.max(max, m.mistakes), 0);
  const members = session.members.map((m) => {
    const isTopOffender = maxMistakes > 0 && m.mistakes === maxMistakes;
    const extraPenalty = isTopOffender ? session.topPenaltyAmount : 0;
    return {
      ...m,
      isTopOffender,
      amountDue: m.mistakes * session.penaltyAmount + extraPenalty,
    };
  });
  const totalMistakes = members.reduce((sum, m) => sum + m.mistakes, 0);
  const totalAmount = members.reduce((sum, m) => sum + m.amountDue, 0);
  res.json({
    date: session.date,
    penaltyAmount: session.penaltyAmount,
    topPenaltyAmount: session.topPenaltyAmount,
    totalMistakes,
    totalAmount,
    members,
  });
});

// --- History: closed-out past days, each with their per-member totals ---
// Public — same reasoning as above.
app.get("/api/history", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT date, member_id, member_name, mistakes, penalty_amount, is_top_offender, extra_penalty
     FROM day_history ORDER BY date DESC, member_name ASC`
  );
  const byDate = new Map();
  for (const r of rows) {
    const key = toDateKey(r.date);
    if (!byDate.has(key)) {
      byDate.set(key, { date: key, totalMistakes: 0, totalAmount: 0, members: [] });
    }
    const entry = byDate.get(key);
    const amountDue = r.mistakes * r.penalty_amount + r.extra_penalty;
    entry.members.push({
      id: r.member_id,
      name: r.member_name,
      mistakes: r.mistakes,
      amountDue,
      isTopOffender: r.is_top_offender,
    });
    entry.totalMistakes += r.mistakes;
    entry.totalAmount += amountDue;
  }
  res.json(Array.from(byDate.values()));
});

export default app;
