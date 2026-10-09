import { v4 as uuid } from 'uuid';
import { Result } from '../../../domain/shared/Result';
import { IMatchRepository } from '../../../domain/match/repositories/IMatchRepository';
import { MatchEvent } from '../../../domain/match/entities/MatchEvent';

interface RegisterGoalInput {
  matchId: string;
  teamId: string;
  playerId: string;
  assistPlayerId?: string | null;
  minute?: number | null;
}

export class RegisterGoalUseCase {
  constructor(private readonly matchRepository: IMatchRepository) {}

  public async execute(input: RegisterGoalInput): Promise<Result<MatchEvent>> {
    const match = await this.matchRepository.findById(input.matchId);
    if (!match) {
      return Result.fail('Match not found.');
    }

    const eventId = uuid();
    const result = match.registerGoal(
      eventId,
      input.teamId,
      input.playerId,
      input.assistPlayerId,
      input.minute,
    );

    if (result.isFailure) {
      return Result.fail(result.error);
    }

    await this.matchRepository.save(match);
    await this.matchRepository.saveEvent(result.value);

    return Result.ok(result.value);
  }
}
