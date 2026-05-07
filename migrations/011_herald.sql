-- HERALD embed platform tables

CREATE TABLE IF NOT EXISTS embed_sites (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  site_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS editor_overrides (
  id SERIAL PRIMARY KEY,
  site_key TEXT NOT NULL REFERENCES embed_sites(site_key) ON DELETE CASCADE,
  page_path TEXT NOT NULL DEFAULT '/',
  eid TEXT NOT NULL,
  css_property TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_key, page_path, eid, css_property)
);

CREATE TABLE IF NOT EXISTS embed_chat_configs (
  id SERIAL PRIMARY KEY,
  site_key TEXT NOT NULL UNIQUE REFERENCES embed_sites(site_key) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'anthropic',
  model TEXT NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
  system_prompt TEXT,
  accent_color TEXT DEFAULT '#D4AF37',
  position TEXT DEFAULT 'bottom-left',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Register ajrcentralcommand.com as the first site
INSERT INTO embed_sites (name, domain, site_key)
VALUES ('AJR Central Command', 'ajrcentralcommand.com', 'ajrcentral')
ON CONFLICT DO NOTHING;
