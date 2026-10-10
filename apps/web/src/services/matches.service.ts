import { apiGet, apiPost, apiPatch, apiDelete } from './api';

export interface MatchEventPlayer {
  id: string;
  name: string;
  nickname: string | null;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  team_id: string;
  event_type: string;
  minute: number | null;
  created_at: string;
  player: MatchEventPlayer | null;
  assist_player: MatchEventPlayer | null;
}

export interface MatchTeamPlayer {
  id: string;
  name: string;
  nickname: string | null;
  avatar_url: string | null;
  stars?: number;
}

export interface MatchTeam {
  id: string;
  name: string;
  color: string;
  players: MatchTeamPlayer[];
}

export interface MatchDetails {
  id: string;
  round_id: string;
  status: string;
  score_a: number;
  score_b: number;
  match_order: number;
  goalkeeper_a_id: string | null;
  goalkeeper_b_id: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  team_a: MatchTeam | null;
  team_b: MatchTeam | null;
  match_events: MatchEvent[];
}

export const matchesService = {
  create: (data: {
    roundId: string;
    teamAId: string;
    teamBId: string;
    matchOrder?: number;
    goalkeeperAId?: string | null;
    goalkeeperBId?: string | null;
  }) => apiPost<{ matchId: string }>('/api/matches', data),
  getDetails: (id: string) => apiGet<MatchDetails>(`/api/matches/${id}`),
  start: (id: string) => apiPatch(`/api/matches/${id}/start`),
  finish: (id: string) => apiPatch(`/api/matches/${id}/finish`),
  updateGoalkeepers: (
    id: string,
    data: { goalkeeperAId?: string | null; goalkeeperBId?: string | null },
  ) => apiPatch(`/api/matches/${id}/goalkeepers`, data),
  registerGoal: (
    id: string,
    data: { teamId: string; playerId: string; assistPlayerId?: string | null; minute?: number | null },
  ) => apiPost<MatchEvent>(`/api/matches/${id}/goals`, data),
  deleteGoal: (matchId: string, eventId: string, teamId: string) =>
    apiDelete(`/api/matches/${matchId}/goals/${eventId}`, { teamId }),
};
