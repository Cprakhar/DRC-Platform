import { Router, Request, Response, NextFunction } from 'express';
import { getSocialMedia } from '../controllers/socialMediaController';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/:id/social-media', function (req, res, next) { rateLimit(req, res, next); }, asyncHandler(getSocialMedia));

export default router;
