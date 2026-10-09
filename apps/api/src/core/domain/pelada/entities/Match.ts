import { Result } from '../../shared/Result';
import { MatchStatus } from '../value-objects/MatchStatus';
import { Score } from '../value-objects/Score';
import { MatchEvent } from './MatchEvent';

export interface MatchProps {
  id: string;
  roundId: string;
  teamAId: string;
  teamBId: string;
  score: Score;
  status: MatchStatus;
  matchOrder: number;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  createdAt?: Date;
  events?: MatchEvent[];
}

export class Match {
  public readonly id: string;
  public readonly roundId: string;
  public readonly teamAId: string;
  public readonly teamBId: string;
  private _score: Score;
  private _status: MatchStatus;
  public readonly matchOrder: number;
  private _startedAt: Date | null;
  private _finishedAt: Date | null;
  public readonly createdAt: Date;
  private _events: MatchEvent[];

  constructor(props: MatchProps) {
    this.id = props.id;
    this.roundId = props.roundId;
    this.teamAId = props.teamAId;
    this.teamBId = props.teamBId;
    this._score = props.score;
    this._status = props.status;
    this.matchOrder = props.matchOrder;
    this._startedAt = props.startedAt ?? null;
    this._finishedAt = props.finishedAt ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this._events = props.events ?? [];
  }

  public get score(): Score {
    return this._score;
  }

  public get status(): MatchStatus {
    return this._status;
  }

  public get startedAt(): Date | null {
    return this._startedAt;
  }

  public get finishedAt(): Date | null {
    return this._finishedAt;
  }

  public get events(): ReadonlyArray<MatchEvent> {
    return [...this._events];
  }

  /**
   * Inicia a partida — muda status para in_progress e registra horário
   */
  public start(): Result<void> {
    if (!this._status.isPending()) {
      return Result.fail('A partida já foi iniciada ou finalizada.');
    }
    this._status = MatchStatus.inProgress();
    this._startedAt = new Date();
    return Result.ok();
  }

  /**
   * Registra um gol e atualiza o placar
   */
  public registerGoal(
    eventId: string,
    teamId: string,
    playerId: string,
    assistPlayerId?: string | null,
    minute?: number | null,
  ): Result<MatchEvent> {
    if (this._status.isFinished()) {
      return Result.fail('Não é possível registrar gols em uma partida já finalizada.');
    }

    if (teamId !== this.teamAId && teamId !== this.teamBId) {
      return Result.fail('O time informado não pertence a esta partida.');
    }

    const event = new MatchEvent({
      id: eventId,
      matchId: this.id,
      eventType: 'goal',
      playerId,
      assistPlayerId,
      teamId,
      minute,
      createdAt: new Date(),
    });

    this._events.push(event);

    if (teamId === this.teamAId) {
      this._score = this._score.addGoalA();
    } else {
      this._score = this._score.addGoalB();
    }

    return Result.ok(event);
  }

  /**
   * Remove um evento de gol e ajusta o placar
   */
  public removeEvent(eventId: string, teamId: string): Result<void> {
    const index = this._events.findIndex((e) => e.id === eventId);
    if (index === -1) {
      return Result.fail('Evento não encontrado nesta partida.');
    }

    this._events.splice(index, 1);

    if (teamId === this.teamAId) {
      this._score = this._score.removeGoalA();
    } else if (teamId === this.teamBId) {
      this._score = this._score.removeGoalB();
    }

    return Result.ok();
  }

  /**
   * Finaliza a partida
   */
  public finish(): Result<void> {
    if (this._status.isFinished()) {
      return Result.fail('A partida já está finalizada.');
    }
    this._status = MatchStatus.create('finished');
    this._finishedAt = new Date();
    return Result.ok();
  }
}
