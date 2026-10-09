import { Router } from 'express';
import { matchesController } from '../controllers/MatchesController';

const router = Router();

router.get('/:id', (req, res) => matchesController.getDetails(req, res));
router.post('/', (req, res) => matchesController.create(req, res));
router.patch('/:id/start', (req, res) => matchesController.start(req, res));
router.patch('/:id/finish', (req, res) => matchesController.finish(req, res));
router.post('/:id/goals', (req, res) => matchesController.registerGoal(req, res));
router.delete('/:id/goals/:eventId', (req, res) => matchesController.deleteGoal(req, res));

export default router;
