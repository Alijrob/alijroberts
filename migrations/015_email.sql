CREATE TABLE IF NOT EXISTS email_accounts (
  id                 SERIAL PRIMARY KEY,
  display_name       TEXT NOT NULL,
  email_address      TEXT NOT NULL,
  imap_host          TEXT NOT NULL,
  imap_port          INTEGER NOT NULL DEFAULT 993,
  smtp_host          TEXT NOT NULL,
  smtp_port          INTEGER NOT NULL DEFAULT 587,
  username           TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  active             BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_folders (
  id            SERIAL PRIMARY KEY,
  account_id    INTEGER NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  path          TEXT NOT NULL,
  delimiter     TEXT,
  flags         TEXT[],
  message_count INTEGER DEFAULT 0,
  unseen_count  INTEGER DEFAULT 0,
  synced_at     TIMESTAMPTZ,
  UNIQUE(account_id, path)
);

CREATE TABLE IF NOT EXISTS email_messages (
  id              SERIAL PRIMARY KEY,
  account_id      INTEGER NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  folder_id       INTEGER REFERENCES email_folders(id) ON DELETE CASCADE,
  uid             BIGINT NOT NULL,
  message_id      TEXT,
  from_name       TEXT,
  from_address    TEXT,
  to_addresses    JSONB DEFAULT '[]',
  cc_addresses    JSONB DEFAULT '[]',
  subject         TEXT,
  snippet         TEXT,
  body_text       TEXT,
  body_html       TEXT,
  date_sent       TIMESTAMPTZ,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  is_starred      BOOLEAN NOT NULL DEFAULT false,
  is_deleted      BOOLEAN NOT NULL DEFAULT false,
  flags           TEXT[],
  has_attachments BOOLEAN NOT NULL DEFAULT false,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, folder_id, uid)
);

CREATE TABLE IF NOT EXISTS email_attachments (
  id           SERIAL PRIMARY KEY,
  message_id   INTEGER NOT NULL REFERENCES email_messages(id) ON DELETE CASCADE,
  filename     TEXT NOT NULL,
  content_type TEXT,
  size         INTEGER,
  content_id   TEXT,
  stored_path  TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_messages_account ON email_messages(account_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_folder  ON email_messages(folder_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_date    ON email_messages(date_sent DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_email_messages_unread  ON email_messages(account_id) WHERE NOT is_read;
