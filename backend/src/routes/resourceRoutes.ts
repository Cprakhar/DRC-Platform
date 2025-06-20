import { Router, Request, Response, NextFunction } from 'express';
import { getNearbyResources, deleteResource } from '../controllers/resourceController';
import { rateLimit } from '../middleware/rateLimit';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Admin-only: get all resources
router.get('/', authenticate, requireRole('admin'), asyncHandler(require('../controllers/resourceController').getAllResources));

// Admin-only: auto-populate resources for a disaster
router.post('/:id/auto-populate', authenticate, requireRole('admin'), asyncHandler(require('../controllers/resourceController').autoPopulateResources));

// Disaster-specific resource endpoints
router.get('/:id/resources', function (req, res, next) { rateLimit(req, res, next); }, asyncHandler(getNearbyResources));
router.delete('/:id/resources/:rid', authenticate, requireRole('admin'), asyncHandler(deleteResource));

export default router;
