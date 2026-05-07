ALTER TABLE email_accounts
  ADD COLUMN IF NOT EXISTS oauth_provider          TEXT,
  ADD COLUMN IF NOT EXISTS oauth_refresh_token_enc TEXT,
  ADD COLUMN IF NOT EXISTS oauth_access_token_enc  TEXT,
  ADD COLUMN IF NOT EXISTS oauth_token_expires_at  TIMESTAMPTZ;
