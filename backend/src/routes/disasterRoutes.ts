import { Router, Request, Response, NextFunction } from 'express';
import {
  createDisaster,
  getDisasters,
  getDisasterById,
  updateDisaster,
  deleteDisaster
} from '../controllers/disasterController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.post('/', authenticate, asyncHandler(createDisaster));
router.get('/', asyncHandler(getDisasters));
router.get('/:id', asyncHandler(getDisasterById));
router.put('/:id', authenticate, asyncHandler(updateDisaster));
router.delete('/:id', authenticate, requireRole('admin'), asyncHandler(deleteDisaster));

export default router;
