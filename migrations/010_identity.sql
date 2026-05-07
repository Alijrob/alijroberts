CREATE TABLE IF NOT EXISTS identity_profile (
  id SERIAL PRIMARY KEY,
  tagline TEXT,
  headline TEXT,
  bio TEXT,
  banner_path TEXT,
  website_url TEXT,
  social_links JSONB DEFAULT '{}',
  section_order TEXT[] DEFAULT ARRAY['about','services','experience','projects','credentials','contact'],
  section_visibility JSONB DEFAULT '{"about":true,"services":true,"experience":true,"projects":true,"credentials":true,"contact":true}',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS identity_experience (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS identity_skills (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  display_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS identity_projects (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  image_path TEXT,
  tags TEXT[] DEFAULT '{}',
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS identity_credentials (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  issuer TEXT,
  issued_date TEXT,
  credential_url TEXT,
  display_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS identity_services (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price_range TEXT,
  icon TEXT DEFAULT '◆',
  display_order INT DEFAULT 0
);
