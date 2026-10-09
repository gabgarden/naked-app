import { Result } from '../../../domain/shared/Result';
import { IMatchRepository } from '../../../domain/match/repositories/IMatchRepository';

interface DeleteGoalEventInput {
  matchId: string;
  eventId: string;
  teamId: string;
}

export class DeleteGoalEventUseCase {
  constructor(private readonly matchRepository: IMatchRepository) {}

  public async execute(input: DeleteGoalEventInput): Promise<Result<void>> {
    const match = await this.matchRepository.findById(input.matchId);
    if (!match) {
      return Result.fail('Match not found.');
    }

    const removeResult = match.removeEvent(input.eventId, input.teamId);
    if (removeResult.isFailure) {
      return Result.fail(removeResult.error);
    }

    await this.matchRepository.save(match);
    await this.matchRepository.deleteEvent(input.eventId);

    return Result.ok();
  }
}
