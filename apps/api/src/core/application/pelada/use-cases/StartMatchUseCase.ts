import { Result } from '../../../domain/shared/Result';
import { IMatchRepository } from '../../../domain/pelada/repositories/IMatchRepository';

interface StartMatchInput {
  matchId: string;
}

export class StartMatchUseCase {
  constructor(private readonly matchRepository: IMatchRepository) {}

  public async execute(input: StartMatchInput): Promise<Result<void>> {
    const match = await this.matchRepository.findById(input.matchId);
    if (!match) {
      return Result.fail('Partida não encontrada.');
    }

    const startResult = match.start();
    if (startResult.isFailure) {
      return Result.fail(startResult.error);
    }

    await this.matchRepository.save(match);
    return Result.ok();
  }
}
