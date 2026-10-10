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
    let rows: any[];
    try {
      rows = await sql`
        SELECT id, name, nickname, avatar_url, COALESCE(stars, 2) as stars, created_at
        FROM players
        ORDER BY name ASC
      `;
    } catch {
      rows = await sql`
        SELECT id, name, nickname, avatar_url, 2 as stars, created_at
        FROM players
        ORDER BY name ASC
      `;
    }

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
    let rows: any[];
    try {
      rows = await sql`
        SELECT id, name, nickname, avatar_url, COALESCE(stars, 2) as stars, created_at
        FROM players
        WHERE id = ${id}
        LIMIT 1
      `;
    } catch {
      rows = await sql`
        SELECT id, name, nickname, avatar_url, 2 as stars, created_at
        WHERE id = ${id}
        LIMIT 1
      `;
    }
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
    const starRating = data.stars ? Math.max(1, Math.min(3, Number(data.stars))) : 2;
    try {
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
    } catch {
      try {
        const rows = await sql`
          INSERT INTO players (name, nickname, avatar_url)
          VALUES (
            ${data.name.trim()},
            ${data.nickname?.trim() || null},
            ${data.avatar_url?.trim() || null}
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
            stars: starRating,
            createdAt: new Date(r.created_at),
          }),
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
      }
    }
  }

  public async update(
    id: string,
    data: UpdatePlayerData,
  ): Promise<{ success: boolean; data?: Player; error?: string }> {
    const starRating = data.stars !== undefined ? Math.max(1, Math.min(3, Number(data.stars))) : null;
    const hasName = data.name !== undefined && Boolean(data.name.trim());
    const hasNickname = data.nickname !== undefined;
    const hasAvatar = data.avatar_url !== undefined;
    const hasStars = starRating !== null;

    try {
      const rows = await sql`
        UPDATE players
        SET
          name = CASE WHEN ${hasName} THEN ${data.name ? data.name.trim() : null} ELSE name END,
          nickname = CASE WHEN ${hasNickname} THEN ${data.nickname ? data.nickname.trim() : null} ELSE nickname END,
          avatar_url = CASE WHEN ${hasAvatar} THEN ${data.avatar_url ? data.avatar_url.trim() : null} ELSE avatar_url END,
          stars = CASE WHEN ${hasStars} THEN ${starRating} ELSE stars END
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
    } catch {
      try {
        const rows = await sql`
          UPDATE players
          SET
            name = CASE WHEN ${hasName} THEN ${data.name ? data.name.trim() : null} ELSE name END,
            nickname = CASE WHEN ${hasNickname} THEN ${data.nickname ? data.nickname.trim() : null} ELSE nickname END,
            avatar_url = CASE WHEN ${hasAvatar} THEN ${data.avatar_url ? data.avatar_url.trim() : null} ELSE avatar_url END
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
            stars: starRating ?? 2,
            createdAt: new Date(r.created_at),
          }),
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
      }
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
      clean_sheets: Number(r.clean_sheets || 0),
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
      clean_sheets: Number(r.clean_sheets || 0),
      round: { date: r.round_date, status: r.round_status },
    }));
  }
}
