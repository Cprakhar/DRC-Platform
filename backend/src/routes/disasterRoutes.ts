import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import {
  createDisaster,
  getDisasters,
  getDisasterById,
  updateDisaster,
  deleteDisaster
} from '../controllers/disasterController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.post('/', authenticate, upload.array('images', 3), asyncHandler(createDisaster));
router.get('/', asyncHandler(getDisasters));
router.get('/:id', asyncHandler(getDisasterById));
router.put('/:id', authenticate, upload.array('images', 3), asyncHandler(updateDisaster));
router.delete('/:id', authenticate, requireRole('admin'), asyncHandler(deleteDisaster));

export default router;
