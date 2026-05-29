CREATE TABLE IF NOT EXISTS sidebar_links (
  id          SERIAL PRIMARY KEY,
  label       TEXT NOT NULL,
  url         TEXT NOT NULL,
  icon_key    TEXT NOT NULL DEFAULT 'link',
  sort_order  INTEGER NOT NULL DEFAULT 100,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sidebar_links_sort_idx ON sidebar_links(sort_order, id);

-- Seed the existing hardcoded Ibis entry so it's editable via the UI
INSERT INTO sidebar_links (label, url, icon_key, sort_order)
SELECT 'Ibis', 'https://ibis.alijroberts.com/', 'feather', 100
WHERE NOT EXISTS (SELECT 1 FROM sidebar_links WHERE label = 'Ibis');
