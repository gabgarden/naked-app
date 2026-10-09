import { Router } from 'express';
import { peladasController } from '../controllers/PeladasController';

const router = Router();

router.get('/', (req, res) => peladasController.list(req, res));
router.get('/:id', (req, res) => peladasController.getById(req, res));
router.post('/', (req, res) => peladasController.create(req, res));
router.patch('/:id/status', (req, res) => peladasController.updateStatus(req, res));
router.patch('/:id/teams/:teamId/players', (req, res) =>
  peladasController.updateTeamPlayers(req, res),
);

export default router;
