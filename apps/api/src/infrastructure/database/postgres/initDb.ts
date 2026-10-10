import { sql } from './client';

export async function initDatabase() {
  try {
    await sql`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      
      CREATE TABLE IF NOT EXISTS players (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT NOT NULL,
        nickname    TEXT,
        avatar_url  TEXT,
        stars       INT NOT NULL DEFAULT 2,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE players ADD COLUMN IF NOT EXISTS stars INT NOT NULL DEFAULT 2;

      CREATE TABLE IF NOT EXISTS rounds (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date        DATE NOT NULL,
        status      TEXT NOT NULL DEFAULT 'draft',
        notes       TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS teams (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        round_id    UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
        name        TEXT NOT NULL,
        color       TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS team_players (
        team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        PRIMARY KEY (team_id, player_id)
      );

      CREATE TABLE IF NOT EXISTS matches (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        round_id    UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
        team_a_id   UUID NOT NULL REFERENCES teams(id),
        team_b_id   UUID NOT NULL REFERENCES teams(id),
        score_a     INT NOT NULL DEFAULT 0,
        score_b     INT NOT NULL DEFAULT 0,
        status      TEXT NOT NULL DEFAULT 'pending',
        match_order INT NOT NULL DEFAULT 1,
        goalkeeper_a_id UUID REFERENCES players(id),
        goalkeeper_b_id UUID REFERENCES players(id),
        started_at  TIMESTAMPTZ,
        finished_at TIMESTAMPTZ,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE matches ADD COLUMN IF NOT EXISTS goalkeeper_a_id UUID REFERENCES players(id);
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS goalkeeper_b_id UUID REFERENCES players(id);

      CREATE TABLE IF NOT EXISTS match_events (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        match_id         UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        team_id          UUID NOT NULL REFERENCES teams(id),
        player_id        UUID NOT NULL REFERENCES players(id),
        assist_player_id UUID REFERENCES players(id),
        event_type       TEXT NOT NULL DEFAULT 'goal',
        minute           INT,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS player_stats (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        player_id    UUID NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE,
        total_games  INT NOT NULL DEFAULT 0,
        total_goals  INT NOT NULL DEFAULT 0,
        total_assists INT NOT NULL DEFAULT 0,
        total_wins   INT NOT NULL DEFAULT 0,
        total_draws  INT NOT NULL DEFAULT 0,
        total_losses INT NOT NULL DEFAULT 0,
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS player_round_stats (
        id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        round_id  UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
        games     INT NOT NULL DEFAULT 0,
        goals     INT NOT NULL DEFAULT 0,
        assists   INT NOT NULL DEFAULT 0,
        wins      INT NOT NULL DEFAULT 0,
        draws     INT NOT NULL DEFAULT 0,
        losses    INT NOT NULL DEFAULT 0,
        UNIQUE (player_id, round_id)
      );

      CREATE INDEX IF NOT EXISTS idx_matches_round_id ON matches(round_id);
      CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON match_events(match_id);
      CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON team_players(team_id);
      CREATE INDEX IF NOT EXISTS idx_player_round_stats_player ON player_round_stats(player_id);
    `;
    console.log('✅ Database schema verified and synchronized.');
  } catch (err) {
    console.warn('⚠️ Database schema sync check warning:', err);
  }
}
