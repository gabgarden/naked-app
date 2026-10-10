import { Router } from 'express';
import { playersController } from '../controllers/PlayersController';

const router = Router();

router.get('/', (req, res) => playersController.list(req, res));
router.get('/:id', (req, res) => playersController.getById(req, res));
router.post('/', (req, res) => playersController.create(req, res));
router.put('/:id', (req, res) => playersController.update(req, res));
router.patch('/:id', (req, res) => playersController.update(req, res));
router.delete('/:id', (req, res) => playersController.remove(req, res));

export default router;
