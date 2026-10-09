import { Router } from 'express';
import { rankingController } from '../controllers/RankingController';

const router = Router();

router.get('/', (req, res) => rankingController.getGlobal(req, res));

export default router;
