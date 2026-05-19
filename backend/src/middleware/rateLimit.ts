import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

// Simple in-memory rate limiter
const readingsCount = new Map<string, { count: number; date: string }>();

export function readingRateLimit(req: Request, res: Response, next: NextFunction): void {
  const userId = req.user?.userId || req.body.userId;
  if (!userId) {
    next();
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const record = readingsCount.get(userId);

  if (record && record.date === today) {
    if (record.count >= config.app.maxFreeReadingsPerDay) {
      res.status(429).json({
        message: `今日免费占卜次数已用完（${config.app.maxFreeReadingsPerDay}次）`,
        remainingReadings: 0,
      });
      return;
    }
    record.count++;
  } else {
    readingsCount.set(userId, { count: 1, date: today });
  }

  next();
}

// Clean up old entries periodically
setInterval(() => {
  const today = new Date().toISOString().split('T')[0];
  for (const [key, value] of readingsCount) {
    if (value.date !== today) readingsCount.delete(key);
  }
}, 60 * 60 * 1000);
