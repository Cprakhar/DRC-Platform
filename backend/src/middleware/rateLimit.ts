// Simple rate limiter middleware (memory-based, per-IP, per-route)
// For production, use Redis or a package like express-rate-limit
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface RateLimitStore {
  [key: string]: { count: number; last: number };
}

const store: RateLimitStore = {};
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30; // 30 requests per minute per IP per route

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip;
  const route = req.baseUrl + req.path;
  const key = `${ip}:${route}`;
  const now = Date.now();
  if (!store[key] || now - store[key].last > WINDOW_MS) {
    store[key] = { count: 1, last: now };
    return next();
  }
  store[key].count++;
  store[key].last = now;
  if (store[key].count > MAX_REQUESTS) {
    logger.warn({ event: 'rate_limit_exceeded', ip, route, count: store[key].count, timestamp: new Date().toISOString() });
    return res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
  next();
}
