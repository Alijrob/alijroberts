-- Onboarding state — single row, id=1 always
CREATE TABLE IF NOT EXISTS onboarding_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  display_name TEXT,
  image_path TEXT,
  vibe TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the single row
INSERT INTO onboarding_state (id) VALUES (1) ON CONFLICT DO NOTHING;
