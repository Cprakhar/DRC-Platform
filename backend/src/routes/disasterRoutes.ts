import { Router, Request, Response, NextFunction } from 'express';
import {
  createDisaster,
  getDisasters,
  updateDisaster,
  deleteDisaster
} from '../controllers/disasterController';

const router = Router();

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.post('/', asyncHandler(createDisaster));
router.get('/', asyncHandler(getDisasters));
router.put('/:id', asyncHandler(updateDisaster));
router.delete('/:id', asyncHandler(deleteDisaster));

export default router;
