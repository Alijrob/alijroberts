ALTER TABLE onboarding_state
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE onboarding_state RENAME COLUMN image_path TO logo_path;
