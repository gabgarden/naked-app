import { Request, Response } from 'express';
import { roundRepository } from '../../../infrastructure/di/container';

export class PeladasController {
  async list(req: Request, res: Response) {
    try {
      const rounds = await roundRepository.findAll();
      res.json({ data: rounds });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar peladas.' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const round = await roundRepository.findByIdWithDetails(req.params.id);
      if (!round) return res.status(404).json({ error: 'Pelada não encontrada.' });
      res.json({ data: round });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar pelada.' });
    }
  }

  async create(req: Request, res: Response) {
    const { date, notes, teams } = req.body;
    if (!date) return res.status(400).json({ error: 'A data é obrigatória.' });

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
      res.status(500).json({ error: 'Erro ao criar pelada.' });
    }
  }

  async updateStatus(req: Request, res: Response) {
    const { status } = req.body;
    const validStatuses = ['draft', 'active', 'finished'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }
    const result = await roundRepository.updateStatus(req.params.id, status);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ success: true });
  }

  async updateTeamPlayers(req: Request, res: Response) {
    const { playerIds } = req.body;
    if (!Array.isArray(playerIds)) {
      return res.status(400).json({ error: 'playerIds deve ser um array.' });
    }
    const result = await roundRepository.updateTeamPlayers(req.params.teamId, playerIds);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ success: true });
  }
}

export const peladasController = new PeladasController();
