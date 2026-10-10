import { apiGet, apiPost, apiPatch, apiDelete } from './api';

export interface Player {
  id: string;
  name: string;
  nickname: string | null;
  avatar_url: string | null;
  stars: number;
  created_at: string;
}

export interface PlayerProfile extends Player {
  stats: PlayerStats | null;
  history: PlayerRoundStats[];
}

export interface PlayerStats {
  total_games: number;
  total_goals: number;
  total_assists: number;
  total_wins: number;
  total_draws: number;
  total_losses: number;
}

export interface PlayerRoundStats {
  id: string;
  round_id: string;
  games: number;
  goals: number;
  assists: number;
  wins: number;
  draws: number;
  losses: number;
  round: { date: string; status: string };
}

export const playersService = {
  list: () => apiGet<Player[]>('/api/players'),
  getById: (id: string) => apiGet<PlayerProfile>(`/api/players/${id}`),
  create: (data: { name: string; nickname?: string; avatar_url?: string; stars?: number }) =>
    apiPost<Player>('/api/players', data),
  update: (
    id: string,
    data: { name?: string; nickname?: string | null; avatar_url?: string | null; stars?: number },
  ) => apiPatch<Player>(`/api/players/${id}`, data),
  delete: (id: string) => apiDelete(`/api/players/${id}`),
};
