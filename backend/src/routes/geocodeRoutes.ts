import { Router, Request, Response, NextFunction } from 'express';
import { geocode } from '../controllers/geocodeController';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.post('/', function (req, res, next) { rateLimit(req, res, next); }, asyncHandler(geocode));

export default router;
