-- ShipLog schema. Idempotent: safe to run on every deploy (pnpm db:migrate).

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  name          text NOT NULL,
  password_hash text NOT NULL,
  is_demo       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  user_id         uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  github_username text,
  standup_format  text NOT NULL DEFAULT 'slack',
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- One row per spoken log. `data` holds the AI-structured sections; `search` powers "Ask your journal".
CREATE TABLE IF NOT EXISTS entries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       date NOT NULL,
  raw        text NOT NULL,
  data       jsonb NOT NULL,
  words      integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  search     tsvector GENERATED ALWAYS AS (to_tsvector('english', raw || ' ' || coalesce(data ->> 'summary', ''))) STORED
);
CREATE INDEX IF NOT EXISTS entries_user_date_idx ON entries (user_id, date DESC);
CREATE INDEX IF NOT EXISTS entries_search_idx ON entries USING gin (search);

-- Generated reports, keyed by the hash of the entries they were built from: unchanged input = no new AI call.
CREATE TABLE IF NOT EXISTS reports (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('standup', 'weekly', 'brag')),
  source_hash text NOT NULL,
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kind, source_hash)
);
