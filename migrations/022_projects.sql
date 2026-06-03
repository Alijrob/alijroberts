-- Projects: canonical store for the cross-app Projects feature.
-- Source of truth lives here on the raven hub (ajr_central); both
-- raven.alijroberts.com and ibis.alijroberts.com read/write via /api/projects.
-- A project record holds the intake fields plus pointers to everything
-- /project-setup writes to GitHub (repo, tracker, onboarding, phases).

CREATE TABLE IF NOT EXISTS projects (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  slug           TEXT UNIQUE,
  description    TEXT,
  goal           TEXT,                          -- scope / session goal (feeds phase breakdown)
  stack          TEXT,                          -- tech stack / platform
  target         TEXT,                          -- primary domain or deployment target
  repo_strategy  TEXT NOT NULL DEFAULT 'new',   -- 'new' | 'pagios-ops' | 'existing'
  repo_name      TEXT,
  repo_url       TEXT,
  tracker_path   TEXT,                          -- pagios-ops/trackers/<project>-phase-tracker.md
  tracker_url    TEXT,                          -- SHA-pinned GitHub blob URL
  onboarding_url TEXT,                          -- docs/setup/onboarding.md blob URL
  phases         JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{n,name,objective,done}, ...]
  artifacts      JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{label,url}, ...] other GitHub blobs
  notes          TEXT,                          -- constraints / freeform
  status         TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'active' | 'archived'
  created_by     TEXT,                          -- 'raven' | 'ibis' | 'project-setup'
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status, id DESC);
