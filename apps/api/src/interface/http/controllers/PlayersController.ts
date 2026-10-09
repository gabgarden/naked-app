import { Request, Response } from 'express';
import { playerRepository } from '../../../infrastructure/di/container';

export class PlayersController {
  async list(req: Request, res: Response) {
    try {
      const players = await playerRepository.findAll();
      res.json({ data: players });
    } catch (err) {
      res.status(500).json({ error: 'Error fetching players.' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const player = await playerRepository.findById(req.params.id);
      if (!player) return res.status(404).json({ error: 'Player not found.' });

      const stats = await playerRepository.getStats(req.params.id);
      const history = await playerRepository.getRoundHistory(req.params.id);

      res.json({ data: { ...player, stats, history } });
    } catch (err) {
      res.status(500).json({ error: 'Error fetching player.' });
    }
  }

  async create(req: Request, res: Response) {
    const { name, nickname, avatar_url } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }
    const result = await playerRepository.create({ name, nickname, avatar_url });
    if (!result.success) return res.status(400).json({ error: result.error });
    res.status(201).json({ data: result.data });
  }

  async update(req: Request, res: Response) {
    const { name, nickname, avatar_url } = req.body;
    const result = await playerRepository.update(req.params.id, { name, nickname, avatar_url });
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ data: result.data });
  }

  async remove(req: Request, res: Response) {
    const result = await playerRepository.delete(req.params.id);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.status(204).send();
  }
}

export const playersController = new PlayersController();
