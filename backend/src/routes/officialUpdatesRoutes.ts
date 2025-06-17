import { Router, Request, Response, NextFunction } from 'express';
import { getOfficialUpdates } from '../controllers/officialUpdatesController';

const router = Router();

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/:id/official-updates', asyncHandler(getOfficialUpdates));

export default router;
