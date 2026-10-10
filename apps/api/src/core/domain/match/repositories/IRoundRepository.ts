import { Round } from '../entities/Round';
import { Team } from '../entities/Team';

export interface CreateRoundData {
  date: string;
  notes?: string;
}

export interface CreateTeamData {
  name: string;
  color: string;
  playerIds: string[];
}

export interface RoundWithDetails {
  id: string;
  date: string;
  status: string;
  notes: string | null;
  created_at: Date;
  teams: TeamWithDetails[];
  matches: MatchSummary[];
}

export interface TeamWithDetails {
  id: string;
  round_id: string;
  name: string;
  color: string;
  players: { id: string; name: string; nickname: string | null; stars?: number }[];
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
  started_at: Date | null;
  finished_at: Date | null;
}

export interface IRoundRepository {
  findAll(): Promise<Round[]>;
  findById(id: string): Promise<Round | null>;
  findByIdWithDetails(id: string): Promise<RoundWithDetails | null>;
  create(data: CreateRoundData): Promise<{ success: boolean; roundId?: string; error?: string }>;
  createWithTeams(
    data: CreateRoundData,
    teams: CreateTeamData[],
  ): Promise<{ success: boolean; roundId?: string; error?: string }>;
  updateStatus(id: string, status: string): Promise<{ success: boolean; error?: string }>;
  updateTeamPlayers(
    teamId: string,
    playerIds: string[],
  ): Promise<{ success: boolean; error?: string }>;
  updateTeam(
    teamId: string,
    data: { name?: string; color?: string },
  ): Promise<{ success: boolean; error?: string }>;
  delete(id: string): Promise<{ success: boolean; error?: string }>;
}
