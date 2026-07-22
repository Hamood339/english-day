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

// Each mistake is its own row (see the `mistakes` table) so it can be marked
// paid or not individually. "Open" (closed = false) mistakes are today's live
// tally — closing the day archives and closes them, so re-closing the same
// calendar day later never double-counts anything.
async function getMemberTallies() {
  const { rows } = await pool.query(
    `SELECT m.id, m.name,
            COUNT(mi.id)::int AS mistakes,
            COUNT(mi.id) FILTER (WHERE mi.paid)::int AS paid_mistakes,
            COUNT(mi.id) FILTER (WHERE NOT mi.paid)::int AS unpaid_mistakes
     FROM members m
     LEFT JOIN mistakes mi ON mi.member_id = m.id AND mi.closed = false
     GROUP BY m.id, m.name
     ORDER BY m.id ASC`
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    mistakes: r.mistakes,
    paidMistakes: r.paid_mistakes,
    unpaidMistakes: r.unpaid_mistakes,
  }));
}

async function getSessionPayload() {
  const state = await getState();
  const members = await getMemberTallies();
  return {
    date: toDateKey(state.current_day),
    soundEnabled: state.sound_enabled,
    penaltyAmount: state.penalty_amount,
    topPenaltyAmount: state.top_penalty_amount,
    members,
  };
}

/**
 * Snapshots every member's current (open) tally into day_history, then marks
 * those mistakes closed. If several members are tied for the most mistakes,
 * exactly one of them is picked at random (the draw) to owe the flat
 * top_penalty_amount fine — the others stay tied on mistakes but don't pay
 * the extra fine. Paid status is untouched either way; only `closed` changes.
 */
async function archiveCurrentDay(date, state) {
  const members = await getMemberTallies();
  const maxMistakes = members.reduce((max, m) => Math.max(max, m.mistakes), 0);
  const candidates = maxMistakes > 0 ? members.filter((m) => m.mistakes === maxMistakes) : [];
  const drawnId =
    candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)].id : null;

  for (const m of members) {
    const isTopOffender = m.id === drawnId;
    const extraPenalty = isTopOffender ? state.top_penalty_amount : 0;
    await pool.query(
      `INSERT INTO day_history
         (date, member_id, member_name, mistakes, penalty_amount, is_top_offender, extra_penalty)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [date, m.id, m.name, m.mistakes, state.penalty_amount, isTopOffender, extraPenalty]
    );
  }

  await pool.query(`UPDATE mistakes SET closed = true WHERE closed = false`);

  return candidates.find((m) => m.id === drawnId) ?? null;
}

/** Archives the current day (running the draw among tied leaders) and moves the cursor. */
async function closeDay() {
  const state = await getState();
  const winner = await archiveCurrentDay(toDateKey(state.current_day), state);
  await pool.query(`UPDATE app_state SET current_day = $1 WHERE id = true`, [todayKey()]);
  return winner;
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

// Closes the books on the current day: archives it to history (running the
// draw if there's a tie), then zeroes every mistake count.
app.post("/api/session-reset", requireAuth, requireAdmin, async (req, res) => {
  const winner = await closeDay();
  res.json({ ...(await getSessionPayload()), drawnWinner: winner });
});

// Called when the calendar day has changed since the last visit.
// keepScores=false archives + resets tallies; keepScores=true just moves the cursor.
app.post("/api/session-new-day", requireAuth, requireAdmin, async (req, res) => {
  const { keepScores } = req.body ?? {};
  let winner = null;
  if (!keepScores) {
    winner = await closeDay();
  } else {
    await pool.query(`UPDATE app_state SET current_day = $1 WHERE id = true`, [todayKey()]);
  }
  res.json({ ...(await getSessionPayload()), drawnWinner: winner });
});

// Triggered by Vercel Cron at 16:30 daily: automatically closes the day,
// running the tie-breaking draw so exactly one top offender owes the fine.
app.get("/api/cron-close-day", async (req, res) => {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const winner = await closeDay();
  res.json({ ok: true, closedAt: new Date().toISOString(), drawnWinner: winner });
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
  const state = await getState();
  await pool.query(`INSERT INTO mistakes (member_id, day_date) VALUES ($1, $2)`, [
    req.query.id,
    toDateKey(state.current_day),
  ]);
  res.json(await getSessionPayload());
});

// Undoes the most recently recorded UNPAID, still-open mistake — paid or
// already-closed (archived) ones are left alone.
app.post("/api/member-undo", requireAuth, requireAdmin, async (req, res) => {
  await pool.query(
    `DELETE FROM mistakes WHERE id = (
       SELECT id FROM mistakes
       WHERE member_id = $1 AND closed = false AND paid = false
       ORDER BY created_at DESC LIMIT 1
     )`,
    [req.query.id]
  );
  res.json(await getSessionPayload());
});

// Marks the oldest unpaid mistake for this member as paid (any day, so a
// backlog from a previous day can be settled too).
app.post("/api/member-pay", requireAuth, requireAdmin, async (req, res) => {
  await pool.query(
    `UPDATE mistakes SET paid = true, paid_at = now() WHERE id = (
       SELECT id FROM mistakes
       WHERE member_id = $1 AND paid = false
       ORDER BY created_at ASC LIMIT 1
     )`,
    [req.query.id]
  );
  res.json(await getSessionPayload());
});

// Undoes the most recent payment for this member, in case of a mis-click.
app.post("/api/member-unpay", requireAuth, requireAdmin, async (req, res) => {
  await pool.query(
    `UPDATE mistakes SET paid = false, paid_at = null WHERE id = (
       SELECT id FROM mistakes
       WHERE member_id = $1 AND paid = true
       ORDER BY paid_at DESC LIMIT 1
     )`,
    [req.query.id]
  );
  res.json(await getSessionPayload());
});

// Full ledger for one member — every mistake ever recorded, oldest first,
// with its paid status. Lets the admin see exactly what's settled and what isn't.
app.get("/api/member-ledger", requireAuth, requireAdmin, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, day_date, paid, paid_at, created_at
     FROM mistakes WHERE member_id = $1 ORDER BY created_at ASC`,
    [req.query.id]
  );
  res.json(
    rows.map((r) => ({
      id: r.id,
      dayDate: toDateKey(r.day_date),
      paid: r.paid,
      paidAt: r.paid_at,
      createdAt: r.created_at,
    }))
  );
});

// --- Summary: total collected today + how much each person currently owes ---
// Public — anyone can see the live scores and penalties without logging in.
app.get("/api/summary", async (req, res) => {
  const session = await getSessionPayload();
  const maxMistakes = session.members.reduce((max, m) => Math.max(max, m.mistakes), 0);
  const members = session.members.map((m) => {
    const isTopOffender = maxMistakes > 0 && m.mistakes === maxMistakes;
    // The top-offender fine isn't decided (or collectable) until the draw at
    // close, so it always shows as still owed in this live preview.
    const extraPenalty = isTopOffender ? session.topPenaltyAmount : 0;
    return {
      ...m,
      isTopOffender,
      amountPaid: m.paidMistakes * session.penaltyAmount,
      amountUnpaid: m.unpaidMistakes * session.penaltyAmount + extraPenalty,
      amountDue: m.mistakes * session.penaltyAmount + extraPenalty,
    };
  });
  const totalMistakes = members.reduce((sum, m) => sum + m.mistakes, 0);
  const totalAmount = members.reduce((sum, m) => sum + m.amountDue, 0);
  const totalPaid = members.reduce((sum, m) => sum + m.amountPaid, 0);
  const totalUnpaid = members.reduce((sum, m) => sum + m.amountUnpaid, 0);
  res.json({
    date: session.date,
    penaltyAmount: session.penaltyAmount,
    topPenaltyAmount: session.topPenaltyAmount,
    totalMistakes,
    totalAmount,
    totalPaid,
    totalUnpaid,
    members,
  });
});

// Toggles whether the top-offender's flat fine for a closed day has been paid.
app.post("/api/history-pay", requireAuth, requireAdmin, async (req, res) => {
  await pool.query(
    `UPDATE day_history
     SET extra_penalty_paid = NOT extra_penalty_paid,
         extra_penalty_paid_at = CASE WHEN extra_penalty_paid THEN null ELSE now() END
     WHERE date = $1 AND is_top_offender = true`,
    [req.query.date]
  );
  res.json({ ok: true });
});

// --- History: closed-out past days, each with their per-member totals ---
// Public — same reasoning as above. Paid/unpaid counts come straight from the
// `mistakes` table, so settling a payment later still shows up here.
app.get("/api/history", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT dh.date, dh.member_id, dh.member_name, dh.mistakes, dh.penalty_amount,
            dh.is_top_offender, dh.extra_penalty, dh.extra_penalty_paid,
            COALESCE(mi.paid_count, 0)::int AS paid_count,
            COALESCE(mi.unpaid_count, 0)::int AS unpaid_count
     FROM day_history dh
     LEFT JOIN (
       SELECT member_id, day_date,
              COUNT(*) FILTER (WHERE paid) AS paid_count,
              COUNT(*) FILTER (WHERE NOT paid) AS unpaid_count
       FROM mistakes WHERE closed = true GROUP BY member_id, day_date
     ) mi ON mi.member_id = dh.member_id AND mi.day_date = dh.date
     ORDER BY dh.date DESC, dh.member_name ASC`
  );
  const byDate = new Map();
  for (const r of rows) {
    const key = toDateKey(r.date);
    if (!byDate.has(key)) {
      byDate.set(key, { date: key, totalMistakes: 0, totalAmount: 0, totalPaid: 0, totalUnpaid: 0, members: [] });
    }
    const entry = byDate.get(key);
    const extraPaid = r.is_top_offender && r.extra_penalty_paid;
    const extraUnpaid = r.is_top_offender && !r.extra_penalty_paid;
    const amountPaid = r.paid_count * r.penalty_amount + (extraPaid ? r.extra_penalty : 0);
    const amountUnpaid = r.unpaid_count * r.penalty_amount + (extraUnpaid ? r.extra_penalty : 0);
    entry.members.push({
      id: r.member_id,
      name: r.member_name,
      mistakes: r.mistakes,
      paidMistakes: r.paid_count,
      unpaidMistakes: r.unpaid_count,
      amountPaid,
      amountUnpaid,
      amountDue: amountPaid + amountUnpaid,
      isTopOffender: r.is_top_offender,
      extraPenaltyPaid: r.extra_penalty_paid,
    });
    entry.totalMistakes += r.mistakes;
    entry.totalAmount += amountPaid + amountUnpaid;
    entry.totalPaid += amountPaid;
    entry.totalUnpaid += amountUnpaid;
  }
  res.json(Array.from(byDate.values()));
});

export default app;
