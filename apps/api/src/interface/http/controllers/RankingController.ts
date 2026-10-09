import { Request, Response } from 'express';
import { rankingRepository } from '../../../infrastructure/di/container';

export class RankingController {
  async getGlobal(req: Request, res: Response) {
    try {
      const ranking = await rankingRepository.getGlobalRanking();
      res.json({ data: ranking });
    } catch (err) {
      res.status(500).json({ error: 'Error fetching ranking.' });
    }
  }
}

export const rankingController = new RankingController();
