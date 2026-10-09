import { PostgresPlayerRepository } from '../repositories/postgres/PostgresPlayerRepository';
import { PostgresMatchRepository } from '../repositories/postgres/PostgresMatchRepository';
import { PostgresRoundRepository } from '../repositories/postgres/PostgresRoundRepository';
import { PostgresRankingRepository } from '../repositories/postgres/PostgresRankingRepository';
import { RegisterGoalUseCase } from '../../core/application/pelada/use-cases/RegisterGoalUseCase';
import { DeleteGoalEventUseCase } from '../../core/application/pelada/use-cases/DeleteGoalEventUseCase';
import { FinishMatchUseCase } from '../../core/application/pelada/use-cases/FinishMatchUseCase';
import { StartMatchUseCase } from '../../core/application/pelada/use-cases/StartMatchUseCase';

// Repositories (singletons)
export const playerRepository = new PostgresPlayerRepository();
export const matchRepository = new PostgresMatchRepository();
export const roundRepository = new PostgresRoundRepository();
export const rankingRepository = new PostgresRankingRepository();

// Use Cases
export const registerGoalUseCase = new RegisterGoalUseCase(matchRepository);
export const deleteGoalEventUseCase = new DeleteGoalEventUseCase(matchRepository);
export const finishMatchUseCase = new FinishMatchUseCase(matchRepository, playerRepository);
export const startMatchUseCase = new StartMatchUseCase(matchRepository);
