import { Match } from '../entities/Match';
import { MatchEvent } from '../entities/MatchEvent';

export interface MatchDetails {
  id: string;
  round_id: string;
  status: string;
  score_a: number;
  score_b: number;
  match_order: number;
  started_at: Date | null;
  finished_at: Date | null;
  created_at: Date;
  team_a: TeamWithPlayers | null;
  team_b: TeamWithPlayers | null;
  match_events: EventWithPlayers[];
}

export interface TeamWithPlayers {
  id: string;
  name: string;
  color: string;
  players: { id: string; name: string; nickname: string | null; avatar_url: string | null }[];
}

export interface EventWithPlayers {
  id: string;
  match_id: string;
  team_id: string;
  event_type: string;
  minute: number | null;
  created_at: Date;
  player: { id: string; name: string; nickname: string | null } | null;
  assist_player: { id: string; name: string; nickname: string | null } | null;
}

export interface IMatchRepository {
  findById(id: string): Promise<Match | null>;
  findByRoundId(roundId: string): Promise<Match[]>;
  getMatchDetails(matchId: string): Promise<MatchDetails | null>;
  create(match: Match): Promise<void>;
  save(match: Match): Promise<void>;
  saveEvent(event: MatchEvent): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
}
