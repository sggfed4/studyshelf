-- Broken-game reports from players, reviewed in /admin.
-- One open report per game per anonymous browser; resubmitting updates it instead of piling up duplicates.
CREATE TABLE IF NOT EXISTS game_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_slug TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('wont-load', 'black-screen', 'controls', 'slow', 'other')),
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'fixed')),
  reporter_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_game_reports_slug_status ON game_reports (game_slug, status);
CREATE INDEX IF NOT EXISTS idx_game_reports_reporter_created ON game_reports (reporter_hash, created_at DESC);
