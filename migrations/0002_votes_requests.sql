-- StudyShelf community voting and game requests.
-- Voter/submitter values are salted hashes of random browser IDs, not names or raw IPs.
CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_slug TEXT NOT NULL,
  voter_hash TEXT NOT NULL,
  direction INTEGER NOT NULL CHECK (direction IN (-1, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (game_slug, voter_hash)
);
CREATE INDEX IF NOT EXISTS idx_votes_game_slug ON votes (game_slug);
CREATE INDEX IF NOT EXISTS idx_votes_updated_at ON votes (updated_at DESC);

CREATE TABLE IF NOT EXISTS game_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitter_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_game_requests_status_created ON game_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_requests_submitter_created ON game_requests (submitter_hash, created_at DESC);
