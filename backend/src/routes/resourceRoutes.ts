import { Router, Request, Response, NextFunction } from 'express';
import { getNearbyResources } from '../controllers/resourceController';

const router = Router();

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/:id/resources', asyncHandler(getNearbyResources));

export default router;
