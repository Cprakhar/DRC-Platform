import { Router, Request, Response, NextFunction } from 'express';
import { getSocialMedia } from '../controllers/socialMediaController';

const router = Router();

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/:id/social-media', asyncHandler(getSocialMedia));

export default router;
