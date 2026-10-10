import { sql } from '../../database/postgres/client';

export interface RankingEntry {
  player_id: string;
  name: string;
  nickname: string | null;
  avatar_url: string | null;
  total_games: number;
  total_goals: number;
  total_assists: number;
  total_wins: number;
  total_draws: number;
  total_losses: number;
  clean_sheets: number;
  points: number;
}

export class PostgresRankingRepository {
  public async getGlobalRanking(): Promise<RankingEntry[]> {
    const rows = await sql`
      SELECT
        p.id as player_id,
        p.name,
        p.nickname,
        p.avatar_url,
        COALESCE(ps.total_games, 0) as total_games,
        COALESCE(ps.total_goals, 0) as total_goals,
        COALESCE(ps.total_assists, 0) as total_assists,
        COALESCE(ps.total_wins, 0) as total_wins,
        COALESCE(ps.total_draws, 0) as total_draws,
        COALESCE(ps.total_losses, 0) as total_losses,
        COALESCE(ps.clean_sheets, 0) as clean_sheets,
        (
          COALESCE(ps.total_wins, 0) * 3 +
          COALESCE(ps.total_draws, 0) * 1 +
          COALESCE(ps.total_goals, 0) * 2 +
          COALESCE(ps.total_assists, 0) * 1 +
          COALESCE(ps.clean_sheets, 0) * 3
        ) as points
      FROM players p
      LEFT JOIN player_stats ps ON ps.player_id = p.id
      ORDER BY points DESC, total_goals DESC, total_wins DESC, name ASC
    `;

    return rows.map((r) => ({
      player_id: r.player_id,
      name: r.name,
      nickname: r.nickname,
      avatar_url: r.avatar_url,
      total_games: Number(r.total_games),
      total_goals: Number(r.total_goals),
      total_assists: Number(r.total_assists),
      total_wins: Number(r.total_wins),
      total_draws: Number(r.total_draws),
      total_losses: Number(r.total_losses),
      clean_sheets: Number(r.clean_sheets || 0),
      points: Number(r.points),
    }));
  }
}
