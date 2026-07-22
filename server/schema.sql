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

-- The persistent roster. Mistake counts are for the current (open) day.
CREATE TABLE IF NOT EXISTS members (
  id serial PRIMARY KEY,
  name text NOT NULL,
  mistakes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

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
  recorded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE day_history ADD COLUMN IF NOT EXISTS is_top_offender boolean NOT NULL DEFAULT false;
ALTER TABLE day_history ADD COLUMN IF NOT EXISTS extra_penalty integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_day_history_date ON day_history(date);
