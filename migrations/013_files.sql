CREATE TABLE IF NOT EXISTS file_nodes (
  id        SERIAL PRIMARY KEY,
  parent_id INTEGER REFERENCES file_nodes(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  type      TEXT NOT NULL CHECK (type IN ('folder', 'note')),
  content   TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
