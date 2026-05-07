CREATE TABLE IF NOT EXISTS tenants (
  id          SERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  domain      TEXT        NOT NULL UNIQUE,
  db_name     TEXT        NOT NULL UNIQUE,
  status      TEXT        NOT NULL DEFAULT 'provisioning',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- status: provisioning | active | suspended | archived
