import { apiGet, apiPost, apiPatch, apiDelete } from './api';

export interface Round {
  id: string;
  date: string;
  status: 'draft' | 'active' | 'finished';
  notes: string | null;
  created_at: string;
}

export interface TeamPlayer {
  id: string;
  name: string;
  nickname: string | null;
  stars?: number;
}

export interface TeamWithDetails {
  id: string;
  round_id: string;
  name: string;
  color: string;
  players: TeamPlayer[];
}

export interface MatchSummary {
  id: string;
  team_a_id: string;
  team_b_id: string;
  score_a: number;
  score_b: number;
  status: string;
  match_order: number;
  goalkeeper_a_id?: string | null;
  goalkeeper_b_id?: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface RoundWithDetails extends Round {
  teams: TeamWithDetails[];
  matches: MatchSummary[];
}

export interface CreateRoundPayload {
  date: string;
  notes?: string;
  teams?: {
    name: string;
    color: string;
    playerIds: string[];
  }[];
}

export const roundsService = {
  list: () => apiGet<Round[]>('/api/rounds'),
  getById: (id: string) => apiGet<RoundWithDetails>(`/api/rounds/${id}`),
  create: (data: CreateRoundPayload) =>
    apiPost<{ roundId: string }>('/api/rounds', data),
  updateStatus: (id: string, status: string) =>
    apiPatch(`/api/rounds/${id}/status`, { status }),
  updateTeamPlayers: (roundId: string, teamId: string, playerIds: string[]) =>
    apiPatch(`/api/rounds/${roundId}/teams/${teamId}/players`, { playerIds }),
  updateTeam: (roundId: string, teamId: string, data: { name?: string; color?: string }) =>
    apiPatch(`/api/rounds/${roundId}/teams/${teamId}`, data),
  delete: (id: string) => apiDelete(`/api/rounds/${id}`),
};

// Compatibility export
export const peladasService = roundsService;
