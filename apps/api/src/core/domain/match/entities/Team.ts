import { Player } from '../../player/entities/Player';

export interface TeamProps {
  id: string;
  roundId: string;
  name: string;
  color: string;
  players?: Player[];
}

export class Team {
  public readonly id: string;
  public readonly roundId: string;
  public readonly name: string;
  public readonly color: string;
  public readonly players: Player[];

  constructor(props: TeamProps) {
    this.id = props.id;
    this.roundId = props.roundId;
    this.name = props.name;
    this.color = props.color;
    this.players = props.players ?? [];
  }
}
