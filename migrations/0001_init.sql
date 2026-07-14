-- Cube Chronicles — initial schema
-- D1 (SQLite). All timestamps are ISO-8601 UTC strings.
-- Soft deletes via *_at columns; moderation status on user-generated content.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Users & auth
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  password_hash   TEXT NOT NULL,
  email_verified  INTEGER NOT NULL DEFAULT 0,   -- 0/1
  role            TEXT NOT NULL DEFAULT 'user',  -- 'user' | 'admin'
  status          TEXT NOT NULL DEFAULT 'active',-- 'active' | 'suspended' | 'banned'
  consent_email_at TEXT,                          -- transactional-email consent timestamp
  notify_default  INTEGER NOT NULL DEFAULT 1,     -- default subscribe-on-post preference
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  deleted_at      TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,                 -- SHA-256 of the emailed token
  created_at  TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  used_at     TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_evt_token ON email_verification_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_evt_user ON email_verification_tokens(user_id);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,                 -- SHA-256 of the cookie token
  created_at  TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  ip          TEXT,
  user_agent  TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ---------------------------------------------------------------------------
-- Editorial content (mirrors src/content for admin visibility & joins).
-- The public site renders editorial content statically from JSON; these tables
-- give the owner a queryable copy and let community rows reference books.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS books (
  slug            TEXT PRIMARY KEY,
  number          INTEGER NOT NULL,
  title           TEXT NOT NULL,
  subtitle        TEXT,
  setting_place   TEXT,
  setting_region  TEXT,
  era             TEXT,
  age_range       TEXT,
  page_count      INTEGER,
  word_count      INTEGER,
  updated_at      TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_books_number ON books(number);

CREATE TABLE IF NOT EXISTS editorial_faqs (
  id          TEXT PRIMARY KEY,             -- e.g. b01-faq01 / series-faq01
  book_slug   TEXT REFERENCES books(slug) ON DELETE CASCADE, -- NULL = series-wide
  anchor      TEXT NOT NULL,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  is_spoiler  INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_efaq_book ON editorial_faqs(book_slug);

-- ---------------------------------------------------------------------------
-- Community discussion (moderated)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
  id          TEXT PRIMARY KEY,
  book_slug   TEXT REFERENCES books(slug) ON DELETE SET NULL, -- NULL = series-wide
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  slug        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending', -- pending|approved|rejected|archived
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  approved_at TEXT,
  deleted_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_questions_book_status ON questions(book_slug, status);
CREATE INDEX IF NOT EXISTS idx_questions_status_created ON questions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_questions_user ON questions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_slug ON questions(slug);

CREATE TABLE IF NOT EXISTS responses (
  id          TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'answer', -- 'answer' | 'comment'
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  approved_at TEXT,
  deleted_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_responses_question_status ON responses(question_id, status);
CREATE INDEX IF NOT EXISTS idx_responses_status_created ON responses(status, created_at);
CREATE INDEX IF NOT EXISTS idx_responses_user ON responses(user_id);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                TEXT PRIMARY KEY,
  question_id       TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'active', -- 'active' | 'unsubscribed'
  unsubscribe_token TEXT NOT NULL,
  created_at        TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subs_unique ON subscriptions(question_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subs_token ON subscriptions(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_subs_question ON subscriptions(question_id, status);

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id          TEXT PRIMARY KEY,
  response_id TEXT NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  status      TEXT NOT NULL,                -- 'sent' | 'failed'
  provider    TEXT,
  provider_id TEXT,
  error       TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nd_status ON notification_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_nd_response ON notification_deliveries(response_id);

CREATE TABLE IF NOT EXISTS content_reports (
  id             TEXT PRIMARY KEY,
  target_type    TEXT NOT NULL,             -- 'question' | 'response'
  target_id      TEXT NOT NULL,
  reporter_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  reason         TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'open', -- 'open' | 'reviewed' | 'dismissed'
  created_at     TEXT NOT NULL,
  reviewed_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON content_reports(target_type, target_id);

CREATE TABLE IF NOT EXISTS moderation_actions (
  id          TEXT PRIMARY KEY,
  admin_id    TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,               -- approve|reject|edit|archive|delete|ban|suspend|unban|restore
  target_type TEXT NOT NULL,               -- 'question' | 'response' | 'user' | 'report'
  target_id   TEXT NOT NULL,
  note        TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_modactions_target ON moderation_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_modactions_admin ON moderation_actions(admin_id, created_at);

CREATE TABLE IF NOT EXISTS rate_limit_events (
  id         TEXT PRIMARY KEY,
  bucket     TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rle_bucket_created ON rate_limit_events(bucket, created_at);
