import { Result } from '../../../domain/shared/Result';
import { IMatchRepository } from '../../../domain/pelada/repositories/IMatchRepository';
import { IPlayerRepository } from '../../../domain/player/repositories/IPlayerRepository';

interface FinishMatchInput {
  matchId: string;
}

export class FinishMatchUseCase {
  constructor(
    private readonly matchRepository: IMatchRepository,
    private readonly playerRepository: IPlayerRepository,
  ) {}

  public async execute(input: FinishMatchInput): Promise<Result<void>> {
    const match = await this.matchRepository.findById(input.matchId);
    if (!match) {
      return Result.fail('Partida não encontrada.');
    }

    const finishResult = match.finish();
    if (finishResult.isFailure) {
      return Result.fail(finishResult.error);
    }

    await this.matchRepository.save(match);
    return Result.ok();
  }
}
