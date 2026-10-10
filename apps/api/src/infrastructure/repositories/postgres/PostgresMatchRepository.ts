import { sql } from '../../database/postgres/client';
import { Match } from '../../../core/domain/match/entities/Match';
import { MatchEvent } from '../../../core/domain/match/entities/MatchEvent';
import {
  IMatchRepository,
  MatchDetails,
} from '../../../core/domain/match/repositories/IMatchRepository';
import { Score } from '../../../core/domain/match/value-objects/Score';
import { MatchStatus } from '../../../core/domain/match/value-objects/MatchStatus';

export class PostgresMatchRepository implements IMatchRepository {
  public async findById(id: string): Promise<Match | null> {
    const rows = await sql`SELECT * FROM matches WHERE id = ${id} LIMIT 1`;
    if (rows.length === 0) return null;
    const matchRow = rows[0];

    const eventRows = await sql`
      SELECT * FROM match_events WHERE match_id = ${id} ORDER BY created_at DESC
    `;
    const events = eventRows.map(
      (e) =>
        new MatchEvent({
          id: e.id,
          matchId: e.match_id,
          eventType: e.event_type,
          playerId: e.player_id,
          assistPlayerId: e.assist_player_id,
          teamId: e.team_id,
          minute: e.minute,
          createdAt: new Date(e.created_at),
        }),
    );

    const scoreResult = Score.create(matchRow.score_a, matchRow.score_b);
    const score = scoreResult.isSuccess ? scoreResult.value : Score.zero();

    return new Match({
      id: matchRow.id,
      roundId: matchRow.round_id,
      teamAId: matchRow.team_a_id,
      teamBId: matchRow.team_b_id,
      score,
      status: MatchStatus.create(matchRow.status),
      matchOrder: matchRow.match_order,
      startedAt: matchRow.started_at ? new Date(matchRow.started_at) : null,
      finishedAt: matchRow.finished_at ? new Date(matchRow.finished_at) : null,
      createdAt: new Date(matchRow.created_at),
      events,
    });
  }

  public async findByRoundId(roundId: string): Promise<Match[]> {
    const rows = await sql`
      SELECT * FROM matches WHERE round_id = ${roundId} ORDER BY match_order ASC
    `;
    return rows.map((r) => {
      const score = Score.create(r.score_a, r.score_b).value ?? Score.zero();
      return new Match({
        id: r.id,
        roundId: r.round_id,
        teamAId: r.team_a_id,
        teamBId: r.team_b_id,
        score,
        status: MatchStatus.create(r.status),
        matchOrder: r.match_order,
        goalkeeperAId: r.goalkeeper_a_id ?? null,
        goalkeeperBId: r.goalkeeper_b_id ?? null,
        startedAt: r.started_at ? new Date(r.started_at) : null,
        finishedAt: r.finished_at ? new Date(r.finished_at) : null,
        createdAt: new Date(r.created_at),
      });
    });
  }

  public async getMatchDetails(matchId: string): Promise<MatchDetails | null> {
    const matchRows = await sql`SELECT * FROM matches WHERE id = ${matchId} LIMIT 1`;
    if (matchRows.length === 0) return null;
    const match = matchRows[0];

    const teamRows = await sql`
      SELECT t.*, tp.player_id, p.id as p_id, p.name as p_name, p.nickname as p_nickname, p.avatar_url as p_avatar_url, COALESCE(p.stars, 2) as p_stars
      FROM teams t
      LEFT JOIN team_players tp ON tp.team_id = t.id
      LEFT JOIN players p ON p.id = tp.player_id
      WHERE t.id IN (${match.team_a_id}, ${match.team_b_id})
    `;

    const buildTeam = (teamId: string) => {
      const teamRows2 = teamRows.filter((r) => r.id === teamId);
      if (teamRows2.length === 0) return null;
      const first = teamRows2[0];
      return {
        id: first.id,
        name: first.name,
        color: first.color,
        players: teamRows2
          .filter((r) => r.p_id)
          .map((r) => ({
            id: r.p_id,
            name: r.p_name,
            nickname: r.p_nickname,
            avatar_url: r.p_avatar_url,
            stars: Number(r.p_stars ?? 2),
          })),
      };
    };

    const eventRows = await sql`
      SELECT
        e.*,
        p.id as p_id, p.name as p_name, p.nickname as p_nickname,
        ap.id as ap_id, ap.name as ap_name, ap.nickname as ap_nickname
      FROM match_events e
      LEFT JOIN players p ON p.id = e.player_id
      LEFT JOIN players ap ON ap.id = e.assist_player_id
      WHERE e.match_id = ${matchId}
      ORDER BY e.created_at DESC
    `;

    return {
      id: match.id,
      round_id: match.round_id,
      status: match.status,
      score_a: match.score_a,
      score_b: match.score_b,
      match_order: match.match_order,
      goalkeeper_a_id: match.goalkeeper_a_id ?? null,
      goalkeeper_b_id: match.goalkeeper_b_id ?? null,
      started_at: match.started_at ? new Date(match.started_at) : null,
      finished_at: match.finished_at ? new Date(match.finished_at) : null,
      created_at: new Date(match.created_at),
      team_a: buildTeam(match.team_a_id),
      team_b: buildTeam(match.team_b_id),
      match_events: eventRows.map((e) => ({
        id: e.id,
        match_id: e.match_id,
        team_id: e.team_id,
        event_type: e.event_type,
        minute: e.minute,
        created_at: new Date(e.created_at),
        player: e.p_id ? { id: e.p_id, name: e.p_name, nickname: e.p_nickname } : null,
        assist_player: e.ap_id ? { id: e.ap_id, name: e.ap_name, nickname: e.ap_nickname } : null,
      })),
    };
  }

  public async create(match: Match): Promise<void> {
    await sql`
      INSERT INTO matches (id, round_id, team_a_id, team_b_id, score_a, score_b, status, match_order, goalkeeper_a_id, goalkeeper_b_id, created_at)
      VALUES (
        ${match.id}, ${match.roundId}, ${match.teamAId}, ${match.teamBId},
        ${match.score.scoreA}, ${match.score.scoreB}, ${match.status.value},
        ${match.matchOrder}, ${match.goalkeeperAId ?? null}, ${match.goalkeeperBId ?? null}, ${match.createdAt.toISOString()}
      )
    `;
  }

  public async updateGoalkeepers(matchId: string, gkAId?: string | null, gkBId?: string | null): Promise<void> {
    await sql`
      UPDATE matches
      SET
        goalkeeper_a_id = ${gkAId !== undefined ? (gkAId || null) : sql`goalkeeper_a_id`},
        goalkeeper_b_id = ${gkBId !== undefined ? (gkBId || null) : sql`goalkeeper_b_id`}
      WHERE id = ${matchId}
    `;
  }

  public async save(match: Match): Promise<void> {
    const current = await sql`SELECT status FROM matches WHERE id = ${match.id}`;
    const wasFinished = current.length > 0 && current[0].status === 'finished';

    await sql`
      UPDATE matches
      SET
        score_a = ${match.score.scoreA},
        score_b = ${match.score.scoreB},
        status = ${match.status.value},
        goalkeeper_a_id = ${match.goalkeeperAId ?? null},
        goalkeeper_b_id = ${match.goalkeeperBId ?? null},
        started_at = ${match.startedAt ? match.startedAt.toISOString() : null},
        finished_at = ${match.finishedAt ? match.finishedAt.toISOString() : null}
      WHERE id = ${match.id}
    `;

    if (!wasFinished && match.status.isFinished()) {
      await this.updateStatsForFinishedMatch(match);
    }
  }

  private async updateStatsForFinishedMatch(match: Match): Promise<void> {
    const scoreA = match.score.scoreA;
    const scoreB = match.score.scoreB;

    let winTeamId: string | null = null;
    let loseTeamId: string | null = null;
    const isDraw = scoreA === scoreB;

    if (!isDraw) {
      if (scoreA > scoreB) {
        winTeamId = match.teamAId;
        loseTeamId = match.teamBId;
      } else {
        winTeamId = match.teamBId;
        loseTeamId = match.teamAId;
      }
    }

    const teamAPlayers = (await sql`
      SELECT player_id FROM team_players WHERE team_id = ${match.teamAId}
    `) as { player_id: string }[];
    const teamBPlayers = (await sql`
      SELECT player_id FROM team_players WHERE team_id = ${match.teamBId}
    `) as { player_id: string }[];

    const events = (await sql`
      SELECT player_id, assist_player_id FROM match_events WHERE match_id = ${match.id}
    `) as { player_id: string; assist_player_id: string | null }[];

    const goalsByPlayer: Record<string, number> = {};
    const assistsByPlayer: Record<string, number> = {};

    for (const ev of events) {
      if (ev.player_id) {
        goalsByPlayer[ev.player_id] = (goalsByPlayer[ev.player_id] || 0) + 1;
      }
      if (ev.assist_player_id) {
        assistsByPlayer[ev.assist_player_id] = (assistsByPlayer[ev.assist_player_id] || 0) + 1;
      }
    }

    const allMatchPlayers: { playerId: string; isWin: boolean; isDraw: boolean; isLoss: boolean }[] = [];

    for (const p of teamAPlayers) {
      const isWin = !isDraw && match.teamAId === winTeamId;
      const isLoss = !isDraw && match.teamAId === loseTeamId;
      allMatchPlayers.push({ playerId: p.player_id, isWin, isDraw, isLoss });
    }

    for (const p of teamBPlayers) {
      const isWin = !isDraw && match.teamBId === winTeamId;
      const isLoss = !isDraw && match.teamBId === loseTeamId;
      allMatchPlayers.push({ playerId: p.player_id, isWin, isDraw, isLoss });
    }

    for (const mp of allMatchPlayers) {
      const goals = goalsByPlayer[mp.playerId] || 0;
      const assists = assistsByPlayer[mp.playerId] || 0;
      const wins = mp.isWin ? 1 : 0;
      const draws = mp.isDraw ? 1 : 0;
      const losses = mp.isLoss ? 1 : 0;

      await sql`
        INSERT INTO player_stats (id, player_id, total_games, total_goals, total_assists, total_wins, total_draws, total_losses, updated_at)
        VALUES (gen_random_uuid(), ${mp.playerId}, 1, ${goals}, ${assists}, ${wins}, ${draws}, ${losses}, NOW())
        ON CONFLICT (player_id) DO UPDATE SET
          total_games = player_stats.total_games + EXCLUDED.total_games,
          total_goals = player_stats.total_goals + EXCLUDED.total_goals,
          total_assists = player_stats.total_assists + EXCLUDED.total_assists,
          total_wins = player_stats.total_wins + EXCLUDED.total_wins,
          total_draws = player_stats.total_draws + EXCLUDED.total_draws,
          total_losses = player_stats.total_losses + EXCLUDED.total_losses,
          updated_at = NOW();
      `;

      await sql`
        INSERT INTO player_round_stats (id, player_id, round_id, games, goals, assists, wins, draws, losses)
        VALUES (gen_random_uuid(), ${mp.playerId}, ${match.roundId}, 1, ${goals}, ${assists}, ${wins}, ${draws}, ${losses})
        ON CONFLICT (player_id, round_id) DO UPDATE SET
          games = player_round_stats.games + EXCLUDED.games,
          goals = player_round_stats.goals + EXCLUDED.goals,
          assists = player_round_stats.assists + EXCLUDED.assists,
          wins = player_round_stats.wins + EXCLUDED.wins,
          draws = player_round_stats.draws + EXCLUDED.draws,
          losses = player_round_stats.losses + EXCLUDED.losses;
      `;
    }
  }

  public async saveEvent(event: MatchEvent): Promise<void> {
    await sql`
      INSERT INTO match_events (id, match_id, event_type, player_id, assist_player_id, team_id, minute, created_at)
      VALUES (
        ${event.id}, ${event.matchId}, ${event.eventType}, ${event.playerId},
        ${event.assistPlayerId}, ${event.teamId}, ${event.minute}, ${event.createdAt.toISOString()}
      )
    `;
  }

  public async deleteEvent(eventId: string): Promise<void> {
    await sql`DELETE FROM match_events WHERE id = ${eventId}`;
  }
}
