CREATE TABLE IF NOT EXISTS user_phones (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('home', 'cell', 'work')),
  number TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_emails (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('personal', 'work')),
  email TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_addresses (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('home', 'mailing')),
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
