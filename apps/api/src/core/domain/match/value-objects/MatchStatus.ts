export type MatchStatusValue = 'pending' | 'in_progress' | 'finished';

export class MatchStatus {
  public readonly value: MatchStatusValue;

  private constructor(value: MatchStatusValue) {
    this.value = value;
  }

  public static create(value: string): MatchStatus {
    const valid: MatchStatusValue[] = ['pending', 'in_progress', 'finished'];
    if (!valid.includes(value as MatchStatusValue)) {
      return new MatchStatus('pending');
    }
    return new MatchStatus(value as MatchStatusValue);
  }

  public static pending(): MatchStatus {
    return new MatchStatus('pending');
  }

  public static inProgress(): MatchStatus {
    return new MatchStatus('in_progress');
  }

  public isFinished(): boolean {
    return this.value === 'finished';
  }

  public isInProgress(): boolean {
    return this.value === 'in_progress';
  }

  public isPending(): boolean {
    return this.value === 'pending';
  }
}
