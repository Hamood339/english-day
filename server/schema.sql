CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Singleton row holding the shared "today" cursor and day-wide settings.
CREATE TABLE IF NOT EXISTS app_state (
  id boolean PRIMARY KEY DEFAULT true,
  current_day date NOT NULL,
  sound_enabled boolean NOT NULL DEFAULT true,
  penalty_amount integer NOT NULL DEFAULT 100,
  top_penalty_amount integer NOT NULL DEFAULT 1000,
  CONSTRAINT single_row CHECK (id)
);

ALTER TABLE app_state ADD COLUMN IF NOT EXISTS top_penalty_amount integer NOT NULL DEFAULT 1000;

-- The persistent roster.
CREATE TABLE IF NOT EXISTS members (
  id serial PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Every individual mistake is its own row, so each one can be marked paid
-- or not — this is what "mistakes" used to be as a plain counter on members.
CREATE TABLE IF NOT EXISTS mistakes (
  id serial PRIMARY KEY,
  member_id integer NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  day_date date NOT NULL,
  paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  -- Set true once this mistake has been folded into a day_history snapshot,
  -- so closing the day twice in one calendar day never double-counts it.
  closed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mistakes ADD COLUMN IF NOT EXISTS closed boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_mistakes_member ON mistakes(member_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_day ON mistakes(day_date);

ALTER TABLE members DROP COLUMN IF EXISTS mistakes;

-- Snapshot of each member's tally, written whenever a day is closed
-- (reset or "start new day"), so past totals stay queryable.
CREATE TABLE IF NOT EXISTS day_history (
  id serial PRIMARY KEY,
  date date NOT NULL,
  member_id integer NOT NULL,
  member_name text NOT NULL,
  mistakes integer NOT NULL,
  penalty_amount integer NOT NULL,
  is_top_offender boolean NOT NULL DEFAULT false,
  extra_penalty integer NOT NULL DEFAULT 0,
  extra_penalty_paid boolean NOT NULL DEFAULT false,
  extra_penalty_paid_at timestamptz,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE day_history ADD COLUMN IF NOT EXISTS is_top_offender boolean NOT NULL DEFAULT false;
ALTER TABLE day_history ADD COLUMN IF NOT EXISTS extra_penalty integer NOT NULL DEFAULT 0;
ALTER TABLE day_history ADD COLUMN IF NOT EXISTS extra_penalty_paid boolean NOT NULL DEFAULT false;
ALTER TABLE day_history ADD COLUMN IF NOT EXISTS extra_penalty_paid_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_day_history_date ON day_history(date);
