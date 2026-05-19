import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/v1/user/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, nickname: true, birthDate: true, birthHour: true,
        birthPlace: true, gender: true, avatarUrl: true,
        zodiac: true, constellation: true, chineseZodiac: true,
        totalReadings: true, currentStreak: true, longestStreak: true,
        memberDays: true, createdAt: true, lastActiveAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: '用户不存在' });
      return;
    }

    // Calculate memberDays
    const memberDays = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    res.json({ ...user, memberDays });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: '获取用户信息失败' });
  }
});

// PUT /api/v1/user/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      nickname: z.string().min(1).max(30).optional(),
      birthDate: z.string().transform((s) => new Date(s)).optional(),
      birthHour: z.number().int().min(0).max(23).optional(),
      birthPlace: z.string().optional(),
      gender: z.string().optional(),
    });
    const data = schema.parse(req.body);

    if (req.user?.userId !== req.params.id) {
      res.status(403).json({ message: '无权修改' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (data.nickname !== undefined) updateData.nickname = data.nickname;
    if (data.birthDate !== undefined) {
      updateData.birthDate = data.birthDate;
      updateData.zodiac = calculateZodiac(data.birthDate);
      updateData.constellation = calculateConstellation(data.birthDate);
      updateData.chineseZodiac = calculateChineseZodiac(data.birthDate.getFullYear());
    }
    if (data.birthHour !== undefined) updateData.birthHour = data.birthHour;
    if (data.birthPlace !== undefined) updateData.birthPlace = data.birthPlace;
    if (data.gender !== undefined) updateData.gender = data.gender;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误', errors: err.errors });
      return;
    }
    console.error('Update user error:', err);
    res.status(500).json({ message: '更新用户信息失败' });
  }
});

function calculateZodiac(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return '白羊座';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return '金牛座';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return '双子座';
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return '巨蟹座';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return '狮子座';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return '处女座';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) return '天秤座';
  if ((month === 10 && day >= 24) || (month === 11 && day <= 21)) return '天蝎座';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return '射手座';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return '摩羯座';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return '水瓶座';
  return '双鱼座';
}

function calculateConstellation(date: Date): string {
  return calculateZodiac(date);
}

function calculateChineseZodiac(year: number): string {
  const animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
  return animals[(year - 4) % 12];
}

export default router;
