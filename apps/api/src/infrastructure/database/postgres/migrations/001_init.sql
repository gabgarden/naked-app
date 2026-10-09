-- ============================================================
-- Pelada App v2 — Migration inicial
-- Modelo sem liga: peladas avulsas com estatísticas acumuladas
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Jogadores (persistem entre peladas)
CREATE TABLE IF NOT EXISTS players (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  nickname    TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Peladas (sessões de jogo)
CREATE TABLE IF NOT EXISTS rounds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'finished')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Times por pelada
CREATE TABLE IF NOT EXISTS teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id    UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jogadores por time
CREATE TABLE IF NOT EXISTS team_players (
  team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, player_id)
);

-- Partidas
CREATE TABLE IF NOT EXISTS matches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id    UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  team_a_id   UUID NOT NULL REFERENCES teams(id),
  team_b_id   UUID NOT NULL REFERENCES teams(id),
  score_a     INT NOT NULL DEFAULT 0,
  score_b     INT NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'finished')),
  match_order INT NOT NULL DEFAULT 1,
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Eventos de gol
CREATE TABLE IF NOT EXISTS match_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id         UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id          UUID NOT NULL REFERENCES teams(id),
  player_id        UUID NOT NULL REFERENCES players(id),
  assist_player_id UUID REFERENCES players(id),
  event_type       TEXT NOT NULL DEFAULT 'goal' CHECK (event_type IN ('goal')),
  minute           INT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Estatísticas acumuladas por jogador (atualizada ao fim de cada partida)
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

-- Histórico de stats por pelada
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_matches_round_id ON matches(round_id);
CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_player_round_stats_player ON player_round_stats(player_id);
