import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import {
  matchRepository,
  registerGoalUseCase,
  deleteGoalEventUseCase,
  finishMatchUseCase,
  startMatchUseCase,
} from '../../../infrastructure/di/container';
import { Match } from '../../../core/domain/match/entities/Match';
import { Score } from '../../../core/domain/match/value-objects/Score';
import { MatchStatus } from '../../../core/domain/match/value-objects/MatchStatus';

export class MatchesController {
  async create(req: Request, res: Response) {
    try {
      const { roundId, teamAId, teamBId, matchOrder } = req.body;
      if (!roundId || !teamAId || !teamBId) {
        return res.status(400).json({ error: 'roundId, teamAId, and teamBId are required.' });
      }

      const id = randomUUID();
      const match = new Match({
        id,
        roundId,
        teamAId,
        teamBId,
        score: Score.zero(),
        status: MatchStatus.create('pending'),
        matchOrder: matchOrder ?? 1,
      });

      await matchRepository.create(match);
      res.status(201).json({ data: { matchId: id } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error creating match.' });
    }
  }

  async getDetails(req: Request, res: Response) {
    try {
      const details = await matchRepository.getMatchDetails(req.params.id);
      if (!details) return res.status(404).json({ error: 'Match not found.' });
      res.json({ data: details });
    } catch (err) {
      res.status(500).json({ error: 'Error fetching match.' });
    }
  }

  async start(req: Request, res: Response) {
    const result = await startMatchUseCase.execute({ matchId: req.params.id });
    if (result.isFailure) return res.status(400).json({ error: result.error });
    res.json({ success: true });
  }

  async finish(req: Request, res: Response) {
    const result = await finishMatchUseCase.execute({ matchId: req.params.id });
    if (result.isFailure) return res.status(400).json({ error: result.error });
    res.json({ success: true });
  }

  async registerGoal(req: Request, res: Response) {
    const { teamId, playerId, assistPlayerId, minute } = req.body;
    if (!teamId || !playerId) {
      return res.status(400).json({ error: 'teamId and playerId are required.' });
    }

    const result = await registerGoalUseCase.execute({
      matchId: req.params.id,
      teamId,
      playerId,
      assistPlayerId,
      minute,
    });

    if (result.isFailure) return res.status(400).json({ error: result.error });
    res.status(201).json({ data: result.value });
  }

  async deleteGoal(req: Request, res: Response) {
    const { teamId } = req.body;
    if (!teamId) return res.status(400).json({ error: 'teamId is required.' });

    const result = await deleteGoalEventUseCase.execute({
      matchId: req.params.id,
      eventId: req.params.eventId,
      teamId,
    });

    if (result.isFailure) return res.status(400).json({ error: result.error });
    res.status(204).send();
  }
}

export const matchesController = new MatchesController();
