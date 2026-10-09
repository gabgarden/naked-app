import { Result } from '../../shared/Result';

export class Score {
  public readonly scoreA: number;
  public readonly scoreB: number;

  private constructor(scoreA: number, scoreB: number) {
    this.scoreA = scoreA;
    this.scoreB = scoreB;
  }

  public static create(scoreA: number, scoreB: number): Result<Score> {
    if (scoreA < 0 || scoreB < 0) {
      return Result.fail('O placar não pode ser negativo.');
    }
    return Result.ok(new Score(scoreA, scoreB));
  }

  public static zero(): Score {
    return new Score(0, 0);
  }

  public addGoalA(): Score {
    return new Score(this.scoreA + 1, this.scoreB);
  }

  public addGoalB(): Score {
    return new Score(this.scoreA, this.scoreB + 1);
  }

  public removeGoalA(): Score {
    return new Score(Math.max(0, this.scoreA - 1), this.scoreB);
  }

  public removeGoalB(): Score {
    return new Score(this.scoreA, Math.max(0, this.scoreB - 1));
  }
}
