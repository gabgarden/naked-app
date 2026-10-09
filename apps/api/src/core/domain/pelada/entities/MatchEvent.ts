export interface MatchEventProps {
  id: string;
  matchId: string;
  eventType: 'goal';
  playerId: string;
  assistPlayerId?: string | null;
  teamId: string;
  minute?: number | null;
  createdAt?: Date;
}

export class MatchEvent {
  public readonly id: string;
  public readonly matchId: string;
  public readonly eventType: 'goal';
  public readonly playerId: string;
  public readonly assistPlayerId: string | null;
  public readonly teamId: string;
  public readonly minute: number | null;
  public readonly createdAt: Date;

  constructor(props: MatchEventProps) {
    this.id = props.id;
    this.matchId = props.matchId;
    this.eventType = props.eventType;
    this.playerId = props.playerId;
    this.assistPlayerId = props.assistPlayerId ?? null;
    this.teamId = props.teamId;
    this.minute = props.minute ?? null;
    this.createdAt = props.createdAt ?? new Date();
  }
}
