import { Request, Response } from 'express';
import { roundRepository } from '../../../infrastructure/di/container';

export class RoundsController {
  async list(req: Request, res: Response) {
    try {
      const rounds = await roundRepository.findAll();
      res.json({ data: rounds });
    } catch (err) {
      res.status(500).json({ error: 'Error fetching rounds.' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const round = await roundRepository.findByIdWithDetails(req.params.id);
      if (!round) return res.status(404).json({ error: 'Round not found.' });
      res.json({ data: round });
    } catch (err) {
      res.status(500).json({ error: 'Error fetching round.' });
    }
  }

  async create(req: Request, res: Response) {
    const { date, notes, teams } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required.' });

    try {
      if (teams && Array.isArray(teams) && teams.length > 0) {
        const result = await roundRepository.createWithTeams({ date, notes }, teams);
        if (!result.success) return res.status(400).json({ error: result.error });
        return res.status(201).json({ data: { roundId: result.roundId } });
      }

      const result = await roundRepository.create({ date, notes });
      if (!result.success) return res.status(400).json({ error: result.error });
      res.status(201).json({ data: { roundId: result.roundId } });
    } catch (err) {
      res.status(500).json({ error: 'Error creating round.' });
    }
  }

  async updateStatus(req: Request, res: Response) {
    const { status } = req.body;
    const validStatuses = ['draft', 'active', 'finished'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const result = await roundRepository.updateStatus(req.params.id, status);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ success: true });
  }

  async updateTeamPlayers(req: Request, res: Response) {
    const { playerIds } = req.body;
    if (!Array.isArray(playerIds)) {
      return res.status(400).json({ error: 'playerIds must be an array.' });
    }
    const result = await roundRepository.updateTeamPlayers(req.params.teamId, playerIds);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ success: true });
  }

  async updateTeam(req: Request, res: Response) {
    const { name, color } = req.body;
    if (!name && !color) {
      return res.status(400).json({ error: 'name or color is required.' });
    }
    const result = await roundRepository.updateTeam(req.params.teamId, { name, color });
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ success: true });
  }

  async remove(req: Request, res: Response) {
    try {
      const result = await roundRepository.delete(req.params.id);
      if (!result.success) return res.status(400).json({ error: result.error });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Error deleting round.' });
    }
  }
}

export const roundsController = new RoundsController();

