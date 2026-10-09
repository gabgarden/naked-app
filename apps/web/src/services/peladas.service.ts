import { apiGet, apiPost, apiPatch } from './api';

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

export const peladasService = {
  list: () => apiGet<Round[]>('/api/peladas'),
  getById: (id: string) => apiGet<RoundWithDetails>(`/api/peladas/${id}`),
  create: (data: CreateRoundPayload) =>
    apiPost<{ roundId: string }>('/api/peladas', data),
  updateStatus: (id: string, status: string) =>
    apiPatch(`/api/peladas/${id}/status`, { status }),
  updateTeamPlayers: (roundId: string, teamId: string, playerIds: string[]) =>
    apiPatch(`/api/peladas/${roundId}/teams/${teamId}/players`, { playerIds }),
};
