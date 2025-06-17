import { Router, Request, Response, NextFunction } from 'express';
import { geocode } from '../controllers/geocodeController';

const router = Router();

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.post('/', asyncHandler(geocode));

export default router;
