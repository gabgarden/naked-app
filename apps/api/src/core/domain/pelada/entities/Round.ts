import { Match } from './Match';
import { Team } from './Team';

export type RoundStatus = 'draft' | 'active' | 'finished';

export interface RoundProps {
  id: string;
  date: string;
  status: RoundStatus;
  notes?: string | null;
  createdAt?: Date;
  teams?: Team[];
  matches?: Match[];
}

export class Round {
  public readonly id: string;
  public readonly date: string;
  public readonly status: RoundStatus;
  public readonly notes: string | null;
  public readonly createdAt: Date;
  public readonly teams: Team[];
  public readonly matches: Match[];

  constructor(props: RoundProps) {
    this.id = props.id;
    this.date = props.date;
    this.status = props.status;
    this.notes = props.notes ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.teams = props.teams ?? [];
    this.matches = props.matches ?? [];
  }
}
