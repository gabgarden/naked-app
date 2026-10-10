import { Router } from 'express';
import { roundsController } from '../controllers/RoundsController';

const router = Router();

router.get('/', (req, res) => roundsController.list(req, res));
router.get('/:id', (req, res) => roundsController.getById(req, res));
router.post('/', (req, res) => roundsController.create(req, res));
router.patch('/:id/status', (req, res) => roundsController.updateStatus(req, res));
router.patch('/:id/teams/:teamId/players', (req, res) =>
  roundsController.updateTeamPlayers(req, res),
);
router.delete('/:id', (req, res) => roundsController.remove(req, res));

export default router;

