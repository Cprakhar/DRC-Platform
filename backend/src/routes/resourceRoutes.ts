import { Router, Request, Response, NextFunction } from 'express';
import { getNearbyResources } from '../controllers/resourceController';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Disaster-specific resource endpoints
router.get('/:id/resources', function (req, res, next) { rateLimit(req, res, next); }, asyncHandler(getNearbyResources));

export default router;
