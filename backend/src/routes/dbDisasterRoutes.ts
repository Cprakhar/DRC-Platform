import { Router, Request, Response, NextFunction } from 'express';
import { getDbDisasters } from '../controllers/dbDisasterController';

const router = Router();

// GET /db-disasters
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  getDbDisasters(req, res).catch(next);
});

export default router;
