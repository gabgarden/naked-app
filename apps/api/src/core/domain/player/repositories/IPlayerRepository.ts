import { Player } from '../entities/Player';

export interface CreatePlayerData {
  name: string;
  nickname?: string | null;
  avatar_url?: string | null;
}

export interface UpdatePlayerData {
  name?: string;
  nickname?: string | null;
  avatar_url?: string | null;
}

export interface PlayerStats {
  player_id: string;
  total_games: number;
  total_goals: number;
  total_assists: number;
  total_wins: number;
  total_draws: number;
  total_losses: number;
  updated_at: Date;
}

export interface PlayerRoundStats {
  id: string;
  player_id: string;
  round_id: string;
  games: number;
  goals: number;
  assists: number;
  wins: number;
  draws: number;
  losses: number;
  round?: {
    date: string;
    status: string;
  };
}

export interface IPlayerRepository {
  findAll(): Promise<Player[]>;
  findById(id: string): Promise<Player | null>;
  create(data: CreatePlayerData): Promise<{ success: boolean; data?: Player; error?: string }>;
  update(id: string, data: UpdatePlayerData): Promise<{ success: boolean; data?: Player; error?: string }>;
  delete(id: string): Promise<{ success: boolean; error?: string }>;
  getStats(playerId: string): Promise<PlayerStats | null>;
  getRoundHistory(playerId: string): Promise<PlayerRoundStats[]>;
}
