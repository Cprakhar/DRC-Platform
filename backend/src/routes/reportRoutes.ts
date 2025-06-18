import { Router, Request, Response, NextFunction } from 'express';
import { createReport, updateReport, deleteReport } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.post('/:id/reports', authenticate, asyncHandler(createReport));
router.put('/:id/reports/:rid', authenticate, asyncHandler(updateReport));
router.delete('/:id/reports/:rid', authenticate, asyncHandler(deleteReport));

export default router;
