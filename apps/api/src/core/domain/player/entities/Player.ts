export interface PlayerProps {
  id: string;
  name: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  createdAt?: Date;
}

export class Player {
  public readonly id: string;
  public readonly name: string;
  public readonly nickname: string | null;
  public readonly avatarUrl: string | null;
  public readonly createdAt: Date;

  constructor(props: PlayerProps) {
    this.id = props.id;
    this.name = props.name;
    this.nickname = props.nickname ?? null;
    this.avatarUrl = props.avatarUrl ?? null;
    this.createdAt = props.createdAt ?? new Date();
  }
}
