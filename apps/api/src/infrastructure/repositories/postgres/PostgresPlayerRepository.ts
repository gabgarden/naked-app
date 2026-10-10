import { sql } from '../../database/postgres/client';
import { Player } from '../../../core/domain/player/entities/Player';
import {
  CreatePlayerData,
  IPlayerRepository,
  PlayerRoundStats,
  PlayerStats,
  UpdatePlayerData,
} from '../../../core/domain/player/repositories/IPlayerRepository';

export class PostgresPlayerRepository implements IPlayerRepository {
  public async findAll(): Promise<Player[]> {
    const rows = await sql`
      SELECT id, name, nickname, avatar_url, COALESCE(stars, 2) as stars, created_at
      FROM players
      ORDER BY name ASC
    `;
    return rows.map(
      (r) =>
        new Player({
          id: r.id,
          name: r.name,
          nickname: r.nickname,
          avatarUrl: r.avatar_url,
          stars: Number(r.stars ?? 2),
          createdAt: new Date(r.created_at),
        }),
    );
  }

  public async findById(id: string): Promise<Player | null> {
    const rows = await sql`
      SELECT id, name, nickname, avatar_url, COALESCE(stars, 2) as stars, created_at
      FROM players
      WHERE id = ${id}
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    const r = rows[0];
    return new Player({
      id: r.id,
      name: r.name,
      nickname: r.nickname,
      avatarUrl: r.avatar_url,
      stars: Number(r.stars ?? 2),
      createdAt: new Date(r.created_at),
    });
  }

  public async create(
    data: CreatePlayerData,
  ): Promise<{ success: boolean; data?: Player; error?: string }> {
    try {
      const starRating = data.stars ? Math.max(1, Math.min(3, Number(data.stars))) : 2;
      const rows = await sql`
        INSERT INTO players (name, nickname, avatar_url, stars)
        VALUES (
          ${data.name.trim()},
          ${data.nickname?.trim() || null},
          ${data.avatar_url?.trim() || null},
          ${starRating}
        )
        RETURNING *
      `;
      const r = rows[0];
      return {
        success: true,
        data: new Player({
          id: r.id,
          name: r.name,
          nickname: r.nickname,
          avatarUrl: r.avatar_url,
          stars: Number(r.stars ?? starRating),
          createdAt: new Date(r.created_at),
        }),
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }

  public async update(
    id: string,
    data: UpdatePlayerData,
  ): Promise<{ success: boolean; data?: Player; error?: string }> {
    try {
      const starRating = data.stars !== undefined ? Math.max(1, Math.min(3, Number(data.stars))) : null;
      const rows = await sql`
        UPDATE players
        SET
          name = COALESCE(${data.name?.trim() || null}, name),
          nickname = ${data.nickname !== undefined ? (data.nickname?.trim() || null) : sql`nickname`},
          avatar_url = ${data.avatar_url !== undefined ? (data.avatar_url?.trim() || null) : sql`avatar_url`},
          stars = ${starRating !== null ? starRating : sql`stars`}
        WHERE id = ${id}
        RETURNING *
      `;
      if (rows.length === 0) return { success: false, error: 'Player not found.' };
      const r = rows[0];
      return {
        success: true,
        data: new Player({
          id: r.id,
          name: r.name,
          nickname: r.nickname,
          avatarUrl: r.avatar_url,
          stars: Number(r.stars ?? 2),
          createdAt: new Date(r.created_at),
        }),
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }

  public async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await sql`DELETE FROM players WHERE id = ${id}`;
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }

  public async getStats(playerId: string): Promise<PlayerStats | null> {
    const rows = await sql`
      SELECT * FROM player_stats WHERE player_id = ${playerId} LIMIT 1
    `;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      player_id: r.player_id,
      total_games: r.total_games,
      total_goals: r.total_goals,
      total_assists: r.total_assists,
      total_wins: r.total_wins,
      total_draws: r.total_draws,
      total_losses: r.total_losses,
      updated_at: new Date(r.updated_at),
    };
  }

  public async getRoundHistory(playerId: string): Promise<PlayerRoundStats[]> {
    const rows = await sql`
      SELECT
        prs.*,
        r.date as round_date,
        r.status as round_status
      FROM player_round_stats prs
      JOIN rounds r ON r.id = prs.round_id
      WHERE prs.player_id = ${playerId}
      ORDER BY r.date DESC
    `;
    return rows.map((r) => ({
      id: r.id,
      player_id: r.player_id,
      round_id: r.round_id,
      games: r.games,
      goals: r.goals,
      assists: r.assists,
      wins: r.wins,
      draws: r.draws,
      losses: r.losses,
      round: { date: r.round_date, status: r.round_status },
    }));
  }
}
