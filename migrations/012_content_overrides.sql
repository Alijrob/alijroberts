-- Text content overrides — stores edited innerText per element per page
CREATE TABLE IF NOT EXISTS content_overrides (
  id SERIAL PRIMARY KEY,
  site_key TEXT NOT NULL REFERENCES embed_sites(site_key) ON DELETE CASCADE,
  page_path TEXT NOT NULL DEFAULT '/',
  eid TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_key, page_path, eid)
);
