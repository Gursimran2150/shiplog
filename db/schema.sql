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
ALTER TABLE settings ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;

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

-- Private-repo access through the ShipLog GitHub App. Only the installation id is stored:
-- access tokens are minted on demand (1 hour) and never persisted.
CREATE TABLE IF NOT EXISTS github_connections (
  user_id         uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  installation_id bigint NOT NULL,
  github_login    text NOT NULL,
  excluded_repos  text[] NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Bitbucket Cloud via OAuth 2.0. Bitbucket access tokens expire after ~2 hours, so the
-- refresh token must be kept: both are stored encrypted (AES-256-GCM), never in plain text.
CREATE TABLE IF NOT EXISTS bitbucket_connections (
  user_id        uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  account_uuid   text NOT NULL,
  username       text NOT NULL,
  access_token   text NOT NULL,
  refresh_token  text NOT NULL,
  expires_at     timestamptz NOT NULL,
  excluded_repos text[] NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);
