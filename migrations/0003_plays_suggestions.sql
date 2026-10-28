-- StudyShelf play tracking and suggestion types.
-- One row per game, per anonymous browser, per UTC day: counts unique daily players, not page refreshes.
CREATE TABLE IF NOT EXISTS plays (
  game_slug TEXT NOT NULL,
  player_hash TEXT NOT NULL,
  day TEXT NOT NULL,
  PRIMARY KEY (game_slug, player_hash, day)
);
CREATE INDEX IF NOT EXISTS idx_plays_day ON plays (day);

-- Requests become general suggestions: game requests, feature ideas, bug reports, or anything else.
ALTER TABLE game_requests ADD COLUMN kind TEXT NOT NULL DEFAULT 'game' CHECK (kind IN ('game', 'feature', 'bug', 'other'));
