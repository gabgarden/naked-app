export interface PlayerProps {
  id: string;
  name: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  stars?: number;
  createdAt?: Date;
}

export class Player {
  public readonly id: string;
  public readonly name: string;
  public readonly nickname: string | null;
  public readonly avatarUrl: string | null;
  public readonly stars: number;
  public readonly createdAt: Date;

  constructor(props: PlayerProps) {
    this.id = props.id;
    this.name = props.name;
    this.nickname = props.nickname ?? null;
    this.avatarUrl = props.avatarUrl ?? null;
    this.stars = Math.max(1, Math.min(3, props.stars ?? 2));
    this.createdAt = props.createdAt ?? new Date();
  }
}
