import { Router, Request, Response, NextFunction } from 'express';
import { getExternalResources } from '../controllers/externalResourceController';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/:id/external-resources', function (req, res, next) { rateLimit(req, res, next); }, asyncHandler(getExternalResources));

export default router;
