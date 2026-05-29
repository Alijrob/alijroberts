-- Media Files module: independent file manager (separate from file_nodes notes tree)
CREATE TABLE IF NOT EXISTS media_files (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  stored_name TEXT,
  parent_id   INTEGER REFERENCES media_files(id) ON DELETE CASCADE,
  is_folder   BOOLEAN DEFAULT FALSE,
  size        BIGINT DEFAULT 0,
  mime_type   TEXT,
  share_token TEXT UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS media_files_parent_idx ON media_files(parent_id);
CREATE INDEX IF NOT EXISTS media_files_share_idx ON media_files(share_token);
