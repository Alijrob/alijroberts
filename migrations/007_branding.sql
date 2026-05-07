ALTER TABLE onboarding_state ADD COLUMN IF NOT EXISTS brand_logo_path TEXT;
ALTER TABLE onboarding_state ADD COLUMN IF NOT EXISTS brand_color_primary TEXT;
ALTER TABLE onboarding_state ADD COLUMN IF NOT EXISTS brand_color_secondary TEXT;
