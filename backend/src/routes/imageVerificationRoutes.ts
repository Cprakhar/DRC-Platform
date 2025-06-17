import { Router, Request, Response, NextFunction } from 'express';
import { verifyImage } from '../controllers/imageVerificationController';

const router = Router();

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.post('/:id/verify-image', asyncHandler(verifyImage));

export default router;
