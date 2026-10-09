import { v4 as uuid } from 'uuid';
import { sql } from '../../database/postgres/client';
import { Round } from '../../../core/domain/match/entities/Round';
import {
  CreateRoundData,
  CreateTeamData,
  IRoundRepository,
  RoundWithDetails,
} from '../../../core/domain/match/repositories/IRoundRepository';

export class PostgresRoundRepository implements IRoundRepository {
  public async findAll(): Promise<Round[]> {
    const rows = await sql`
      SELECT * FROM rounds ORDER BY date DESC
    `;
    return rows.map(
      (r) =>
        new Round({
          id: r.id,
          date: r.date,
          status: r.status,
          notes: r.notes,
          createdAt: new Date(r.created_at),
        }),
    );
  }

  public async findById(id: string): Promise<Round | null> {
    const rows = await sql`SELECT * FROM rounds WHERE id = ${id} LIMIT 1`;
    if (rows.length === 0) return null;
    const r = rows[0];
    return new Round({
      id: r.id,
      date: r.date,
      status: r.status,
      notes: r.notes,
      createdAt: new Date(r.created_at),
    });
  }

  public async findByIdWithDetails(id: string): Promise<RoundWithDetails | null> {
    const roundRows = await sql`SELECT * FROM rounds WHERE id = ${id} LIMIT 1`;
    if (roundRows.length === 0) return null;
    const round = roundRows[0];

    const teamRows = await sql`
      SELECT t.*, tp.player_id, p.id as p_id, p.name as p_name, p.nickname as p_nickname
      FROM teams t
      LEFT JOIN team_players tp ON tp.team_id = t.id
      LEFT JOIN players p ON p.id = tp.player_id
      WHERE t.round_id = ${id}
      ORDER BY t.name ASC
    `;

    const teamsMap = new Map<string, RoundWithDetails['teams'][number]>();
    for (const row of teamRows) {
      if (!teamsMap.has(row.id)) {
        teamsMap.set(row.id, {
          id: row.id,
          round_id: row.round_id,
          name: row.name,
          color: row.color,
          players: [],
        });
      }
      if (row.p_id) {
        teamsMap.get(row.id)!.players.push({
          id: row.p_id,
          name: row.p_name,
          nickname: row.p_nickname,
        });
      }
    }

    const matchRows = await sql`
      SELECT * FROM matches WHERE round_id = ${id} ORDER BY match_order ASC
    `;

    return {
      id: round.id,
      date: round.date,
      status: round.status,
      notes: round.notes,
      created_at: new Date(round.created_at),
      teams: Array.from(teamsMap.values()),
      matches: matchRows.map((m) => ({
        id: m.id,
        team_a_id: m.team_a_id,
        team_b_id: m.team_b_id,
        score_a: m.score_a,
        score_b: m.score_b,
        status: m.status,
        match_order: m.match_order,
        started_at: m.started_at ? new Date(m.started_at) : null,
        finished_at: m.finished_at ? new Date(m.finished_at) : null,
      })),
    };
  }

  public async create(
    data: CreateRoundData,
  ): Promise<{ success: boolean; roundId?: string; error?: string }> {
    try {
      const id = uuid();
      await sql`
        INSERT INTO rounds (id, date, status, notes)
        VALUES (${id}, ${data.date}, 'draft', ${data.notes || null})
      `;
      return { success: true, roundId: id };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }

  public async createWithTeams(
    data: CreateRoundData,
    teams: CreateTeamData[],
  ): Promise<{ success: boolean; roundId?: string; error?: string }> {
    try {
      const roundId = uuid();
      await sql`
        INSERT INTO rounds (id, date, status, notes)
        VALUES (${roundId}, ${data.date}, 'active', ${data.notes || null})
      `;

      for (const team of teams) {
        const teamId = uuid();
        await sql`
          INSERT INTO teams (id, round_id, name, color)
          VALUES (${teamId}, ${roundId}, ${team.name}, ${team.color})
        `;
        for (const playerId of team.playerIds) {
          await sql`
            INSERT INTO team_players (team_id, player_id) VALUES (${teamId}, ${playerId})
            ON CONFLICT DO NOTHING
          `;
        }
      }

      // Criar partidas automaticamente (round-robin entre os times)
      const teamIds = await sql`SELECT id FROM teams WHERE round_id = ${roundId}`;
      let matchOrder = 1;
      for (let i = 0; i < teamIds.length; i++) {
        for (let j = i + 1; j < teamIds.length; j++) {
          const matchId = uuid();
          await sql`
            INSERT INTO matches (id, round_id, team_a_id, team_b_id, score_a, score_b, status, match_order)
            VALUES (${matchId}, ${roundId}, ${teamIds[i].id}, ${teamIds[j].id}, 0, 0, 'pending', ${matchOrder++})
          `;
        }
      }

      return { success: true, roundId };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }

  public async updateStatus(
    id: string,
    status: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await sql`UPDATE rounds SET status = ${status} WHERE id = ${id}`;
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }

  public async updateTeamPlayers(
    teamId: string,
    playerIds: string[],
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await sql`DELETE FROM team_players WHERE team_id = ${teamId}`;
      for (const playerId of playerIds) {
        await sql`INSERT INTO team_players (team_id, player_id) VALUES (${teamId}, ${playerId}) ON CONFLICT DO NOTHING`;
      }
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }
}
