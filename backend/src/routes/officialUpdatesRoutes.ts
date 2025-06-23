import { Router, Request, Response, NextFunction } from 'express';
import { getOfficialUpdates } from '../controllers/officialUpdatesController';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/official-updates', function (req, res, next) { rateLimit(req, res, next); }, asyncHandler(getOfficialUpdates));

export default router;
