import { apiGet } from './api';

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

export const rankingService = {
  getGlobal: () => apiGet<RankingEntry[]>('/api/ranking'),
};
