import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { getArchiveStats, getTimeline } from '../services/archiveService';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/v1/archive/:userId — paginated archive list
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);

    if (req.user?.userId !== userId) {
      res.status(403).json({ message: '无权访问' });
      return;
    }

    const [items, total] = await Promise.all([
      prisma.fateArchive.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.fateArchive.count({ where: { userId } }),
    ]);

    res.json({
      items,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    });
  } catch (err) {
    console.error('Archive list error:', err);
    res.status(500).json({ message: '获取档案列表失败' });
  }
});

// GET /api/v1/archive/entry/:id
router.get('/entry/:id', async (req: Request, res: Response) => {
  try {
    const entry = await prisma.fateArchive.findUnique({
      where: { id: req.params.id },
    });
    if (!entry) {
      res.status(404).json({ message: '记录不存在' });
      return;
    }
    if (req.user?.userId !== entry.userId) {
      res.status(403).json({ message: '无权访问' });
      return;
    }
    res.json(entry);
  } catch (err) {
    console.error('Archive detail error:', err);
    res.status(500).json({ message: '获取记录失败' });
  }
});

// PUT /api/v1/archive/entry/:id/status — update prediction status
router.put('/entry/:id/status', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      status: z.enum(['pending', 'fulfilled', 'unfulfilled', 'partially']),
      note: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const entry = await prisma.fateArchive.findUnique({
      where: { id: req.params.id },
    });
    if (!entry) {
      res.status(404).json({ message: '记录不存在' });
      return;
    }
    if (req.user?.userId !== entry.userId) {
      res.status(403).json({ message: '无权访问' });
      return;
    }

    const updated = await prisma.fateArchive.update({
      where: { id: req.params.id },
      data: {
        predictionStatus: data.status,
        predictionNote: data.note,
      },
    });

    // Update user's fulfilled count
    if (data.status === 'fulfilled') {
      await prisma.user.update({
        where: { id: entry.userId },
        data: { fulfilledPredictions: { increment: 1 } },
      });
    }

    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误' });
      return;
    }
    console.error('Status update error:', err);
    res.status(500).json({ message: '更新失败' });
  }
});

// GET /api/v1/archive/:userId/stats
router.get('/:userId/stats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (req.user?.userId !== userId) {
      res.status(403).json({ message: '无权访问' });
      return;
    }
    const stats = await getArchiveStats(userId);
    res.json(stats);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: '获取统计数据失败' });
  }
});

// GET /api/v1/archive/:userId/timeline
router.get('/:userId/timeline', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (req.user?.userId !== userId) {
      res.status(403).json({ message: '无权访问' });
      return;
    }
    const timeline = await getTimeline(userId);
    res.json(timeline);
  } catch (err) {
    console.error('Timeline error:', err);
    res.status(500).json({ message: '获取时间线失败' });
  }
});

export default router;
