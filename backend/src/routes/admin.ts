import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config';
import { hashPassword, verifyPassword } from '../services/authService';
import { adminAuthMiddleware } from '../middleware/adminAuth';

const router = Router();
const prisma = new PrismaClient();

// ── Helpers ──

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

function calculateChineseZodiac(year: number): string {
  const animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
  return animals[(year - 4) % 12];
}

function parseJsonField<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

function getUserSelect() {
  return {
    id: true, nickname: true, email: true, role: true, isDeleted: true,
    authProvider: true, avatarUrl: true, totalReadings: true,
    fulfilledPredictions: true, currentStreak: true, longestStreak: true,
    memberDays: true, birthDate: true, gender: true,
    zodiac: true, constellation: true, chineseZodiac: true,
    createdAt: true, lastActiveAt: true, deletedAt: true,
  };
}

// ── Admin Auth (no middleware) ──

// POST /api/v1/admin/auth/login
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }).parse(req.body);

    const admin = await prisma.user.findFirst({
      where: { email, role: 'admin', isDeleted: false },
    });

    if (!admin || !admin.passwordHash || !verifyPassword(password, admin.passwordHash)) {
      res.status(401).json({ message: '管理员账号或密码错误' });
      return;
    }

    const token = jwt.sign({ userId: admin.id, role: 'admin' }, config.adminJwt.secret, {
      expiresIn: config.adminJwt.expiresIn,
    } as jwt.SignOptions);

    res.json({
      token,
      admin: {
        id: admin.id,
        nickname: admin.nickname,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误' });
      return;
    }
    console.error('Admin login error:', err);
    res.status(500).json({ message: '登录失败' });
  }
});

// GET /api/v1/admin/auth/me
router.get('/auth/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: '未提供认证令牌' });
      return;
    }
    const payload = jwt.verify(authHeader.slice(7), config.adminJwt.secret) as { userId: string; role: string };
    const admin = await prisma.user.findFirst({
      where: { id: payload.userId, role: 'admin', isDeleted: false },
      select: { id: true, nickname: true, email: true, role: true, createdAt: true },
    });
    if (!admin) {
      res.status(403).json({ message: '无权访问管理后台' });
      return;
    }
    res.json({ admin });
  } catch {
    res.status(401).json({ message: '认证令牌无效或已过期' });
  }
});

// ── All routes below require admin auth ──
router.use(adminAuthMiddleware);

// ── User Management ──

// GET /api/v1/admin/users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
      search: z.string().optional(),
      authProvider: z.string().optional(),
      role: z.string().optional(),
      isDeleted: z.coerce.boolean().optional(),
      sortBy: z.enum(['createdAt', 'nickname', 'email', 'totalReadings', 'lastActiveAt']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    });
    const query = schema.parse(req.query);

    const where: Prisma.UserWhereInput = {};
    if (query.search) {
      where.OR = [
        { nickname: { contains: query.search } },
        { email: { contains: query.search } },
      ];
    }
    if (query.authProvider) where.authProvider = query.authProvider;
    if (query.role) where.role = query.role;
    if (query.isDeleted !== undefined) where.isDeleted = query.isDeleted;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: getUserSelect(),
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      hasMore: query.page * query.pageSize < total,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误' });
      return;
    }
    console.error('Admin users list error:', err);
    res.status(500).json({ message: '获取用户列表失败' });
  }
});

// GET /api/v1/admin/users/:id
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const [user, archiveCount, fortuneCount, chatCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.params.id },
        select: {
          ...getUserSelect(),
          birthHour: true, birthPlace: true, passwordHash: false,
        },
      }),
      prisma.fateArchive.count({ where: { userId: req.params.id } }),
      prisma.dailyFortune.count({ where: { userId: req.params.id } }),
      prisma.chatContext.count({ where: { userId: req.params.id } }),
    ]);

    if (!user) {
      res.status(404).json({ message: '用户不存在' });
      return;
    }

    res.json({ ...user, archiveCount, fortuneCount, chatCount });
  } catch (err) {
    console.error('Admin user detail error:', err);
    res.status(500).json({ message: '获取用户信息失败' });
  }
});

// PUT /api/v1/admin/users/:id
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      nickname: z.string().min(1).max(30).optional(),
      email: z.string().email().optional(),
      birthDate: z.string().transform((s) => new Date(s)).optional(),
      birthHour: z.number().int().min(0).max(23).optional(),
      birthPlace: z.string().optional(),
      gender: z.string().optional(),
      role: z.enum(['user', 'admin']).optional(),
      password: z.string().min(6).max(100).optional(),
    });
    const data = schema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ message: '用户不存在' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (data.nickname !== undefined) updateData.nickname = data.nickname;
    if (data.email !== undefined) {
      const emailOwner = await prisma.user.findUnique({ where: { email: data.email } });
      if (emailOwner && emailOwner.id !== req.params.id) {
        res.status(409).json({ message: '该邮箱已被使用' });
        return;
      }
      updateData.email = data.email;
    }
    if (data.birthDate !== undefined) {
      updateData.birthDate = data.birthDate;
      updateData.zodiac = calculateZodiac(data.birthDate);
      updateData.chineseZodiac = calculateChineseZodiac(data.birthDate.getFullYear());
    }
    if (data.birthHour !== undefined) updateData.birthHour = data.birthHour;
    if (data.birthPlace !== undefined) updateData.birthPlace = data.birthPlace;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.password !== undefined) updateData.passwordHash = hashPassword(data.password);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: getUserSelect(),
    });

    res.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误', errors: err.errors });
      return;
    }
    console.error('Admin user update error:', err);
    res.status(500).json({ message: '更新用户失败' });
  }
});

// DELETE /api/v1/admin/users/:id — soft delete
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      res.status(404).json({ message: '用户不存在' });
      return;
    }
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    res.json({ message: '用户已删除' });
  } catch (err) {
    console.error('Admin user delete error:', err);
    res.status(500).json({ message: '删除用户失败' });
  }
});

// POST /api/v1/admin/users/:id/restore
router.post('/users/:id/restore', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      res.status(404).json({ message: '用户不存在' });
      return;
    }
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isDeleted: false, deletedAt: null },
      select: getUserSelect(),
    });
    res.json(updated);
  } catch (err) {
    console.error('Admin user restore error:', err);
    res.status(500).json({ message: '恢复用户失败' });
  }
});

// ── Daily Fortune Management ──

// GET /api/v1/admin/fortunes
router.get('/fortunes', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
      userId: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      minScore: z.coerce.number().int().min(0).max(100).optional(),
      maxScore: z.coerce.number().int().min(0).max(100).optional(),
    });
    const query = schema.parse(req.query);

    const where: Prisma.DailyFortuneWhereInput = {};
    if (query.userId) where.userId = query.userId;
    if (query.dateFrom || query.dateTo) {
      where.date = {};
      if (query.dateFrom) where.date.gte = new Date(query.dateFrom);
      if (query.dateTo) where.date.lte = new Date(query.dateTo);
    }
    if (query.minScore !== undefined || query.maxScore !== undefined) {
      where.overallScore = {};
      if (query.minScore !== undefined) where.overallScore.gte = query.minScore;
      if (query.maxScore !== undefined) where.overallScore.lte = query.maxScore;
    }

    const [items, total] = await Promise.all([
      prisma.dailyFortune.findMany({
        where,
        include: { user: { select: { id: true, nickname: true, email: true } } },
        orderBy: { date: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.dailyFortune.count({ where }),
    ]);

    res.json({
      items: items.map((f) => ({
        ...f,
        categories: parseJsonField(f.categories, []),
        reminders: parseJsonField(f.reminders, []),
        yi: parseJsonField(f.yi, []),
        ji: parseJsonField(f.ji, []),
        divineSign: parseJsonField(f.divineSign, null),
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
      hasMore: query.page * query.pageSize < total,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误' });
      return;
    }
    console.error('Admin fortunes list error:', err);
    res.status(500).json({ message: '获取运势列表失败' });
  }
});

// GET /api/v1/admin/fortunes/:id
router.get('/fortunes/:id', async (req: Request, res: Response) => {
  try {
    const fortune = await prisma.dailyFortune.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, nickname: true, email: true } } },
    });
    if (!fortune) {
      res.status(404).json({ message: '运势记录不存在' });
      return;
    }
    res.json({
      ...fortune,
      categories: parseJsonField(fortune.categories, []),
      reminders: parseJsonField(fortune.reminders, []),
      yi: parseJsonField(fortune.yi, []),
      ji: parseJsonField(fortune.ji, []),
      divineSign: parseJsonField(fortune.divineSign, null),
    });
  } catch (err) {
    console.error('Admin fortune detail error:', err);
    res.status(500).json({ message: '获取运势详情失败' });
  }
});

// DELETE /api/v1/admin/fortunes/:id
router.delete('/fortunes/:id', async (req: Request, res: Response) => {
  try {
    const fortune = await prisma.dailyFortune.findUnique({ where: { id: req.params.id } });
    if (!fortune) {
      res.status(404).json({ message: '运势记录不存在' });
      return;
    }
    await prisma.dailyFortune.delete({ where: { id: req.params.id } });
    res.json({ message: '运势记录已删除' });
  } catch (err) {
    console.error('Admin fortune delete error:', err);
    res.status(500).json({ message: '删除运势记录失败' });
  }
});

// ── Fate Archive Management ──

// GET /api/v1/admin/archives
router.get('/archives', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
      userId: z.string().optional(),
      type: z.string().optional(),
      predictionStatus: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    });
    const query = schema.parse(req.query);

    const where: Prisma.FateArchiveWhereInput = {};
    if (query.userId) where.userId = query.userId;
    if (query.type) where.type = query.type;
    if (query.predictionStatus) where.predictionStatus = query.predictionStatus;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const [items, total] = await Promise.all([
      prisma.fateArchive.findMany({
        where,
        include: { user: { select: { id: true, nickname: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.fateArchive.count({ where }),
    ]);

    res.json({
      items: items.map((a) => ({
        ...a,
        tags: parseJsonField(a.tags, []),
        cards: parseJsonField(a.cards, null),
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
      hasMore: query.page * query.pageSize < total,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误' });
      return;
    }
    console.error('Admin archives list error:', err);
    res.status(500).json({ message: '获取占卜记录列表失败' });
  }
});

// GET /api/v1/admin/archives/:id
router.get('/archives/:id', async (req: Request, res: Response) => {
  try {
    const archive = await prisma.fateArchive.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, nickname: true, email: true } } },
    });
    if (!archive) {
      res.status(404).json({ message: '占卜记录不存在' });
      return;
    }
    res.json({
      ...archive,
      tags: parseJsonField(archive.tags, []),
      cards: parseJsonField(archive.cards, null),
      readingResult: parseJsonField(archive.readingResult, null),
    });
  } catch (err) {
    console.error('Admin archive detail error:', err);
    res.status(500).json({ message: '获取占卜记录详情失败' });
  }
});

// DELETE /api/v1/admin/archives/:id
router.delete('/archives/:id', async (req: Request, res: Response) => {
  try {
    const archive = await prisma.fateArchive.findUnique({ where: { id: req.params.id } });
    if (!archive) {
      res.status(404).json({ message: '占卜记录不存在' });
      return;
    }
    await prisma.fateArchive.delete({ where: { id: req.params.id } });
    res.json({ message: '占卜记录已删除' });
  } catch (err) {
    console.error('Admin archive delete error:', err);
    res.status(500).json({ message: '删除占卜记录失败' });
  }
});

// ── Chat Context Management ──

// GET /api/v1/admin/chat-contexts
router.get('/chat-contexts', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
      userId: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    });
    const query = schema.parse(req.query);

    const where: Prisma.ChatContextWhereInput = {};
    if (query.userId) where.userId = query.userId;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const [items, total] = await Promise.all([
      prisma.chatContext.findMany({
        where,
        include: { user: { select: { id: true, nickname: true, email: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.chatContext.count({ where }),
    ]);

    res.json({
      items: items.map((c) => ({
        id: c.id,
        userId: c.userId,
        contextId: c.contextId,
        messageCount: parseJsonField(c.messages, []).length,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        user: c.user,
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
      hasMore: query.page * query.pageSize < total,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误' });
      return;
    }
    console.error('Admin chat contexts list error:', err);
    res.status(500).json({ message: '获取对话列表失败' });
  }
});

// GET /api/v1/admin/chat-contexts/:id
router.get('/chat-contexts/:id', async (req: Request, res: Response) => {
  try {
    const chat = await prisma.chatContext.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, nickname: true, email: true } } },
    });
    if (!chat) {
      res.status(404).json({ message: '对话记录不存在' });
      return;
    }
    res.json({
      ...chat,
      messages: parseJsonField(chat.messages, []),
    });
  } catch (err) {
    console.error('Admin chat context detail error:', err);
    res.status(500).json({ message: '获取对话详情失败' });
  }
});

// DELETE /api/v1/admin/chat-contexts/:contextId
router.delete('/chat-contexts/:contextId', async (req: Request, res: Response) => {
  try {
    const chat = await prisma.chatContext.findUnique({ where: { contextId: req.params.contextId } });
    if (!chat) {
      res.status(404).json({ message: '对话记录不存在' });
      return;
    }
    await prisma.chatContext.delete({ where: { contextId: req.params.contextId } });
    res.json({ message: '对话记录已删除' });
  } catch (err) {
    console.error('Admin chat context delete error:', err);
    res.status(500).json({ message: '删除对话记录失败' });
  }
});

// ── Dashboard ──

// GET /api/v1/admin/dashboard/stats
router.get('/dashboard/stats', async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      newUsersToday,
      activeUsersToday,
      deletedUsers,
      adminCount,
      totalReadings,
      totalFortunes,
      totalChatSessions,
      fulfilledPredictions,
      pendingPredictions,
      unfulfilledPredictions,
      usersByStreak,
      usersLast7Days,
      readingsLast7Days,
      chatsLast7Days,
      fortuneCountLast7Days,
    ] = await Promise.all([
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { createdAt: { gte: today }, isDeleted: false } }),
      prisma.user.count({ where: { lastActiveAt: { gte: today }, isDeleted: false } }),
      prisma.user.count({ where: { isDeleted: true } }),
      prisma.user.count({ where: { role: 'admin', isDeleted: false } }),
      prisma.fateArchive.count(),
      prisma.dailyFortune.count(),
      prisma.chatContext.count(),
      prisma.fateArchive.count({ where: { predictionStatus: 'fulfilled' } }),
      prisma.fateArchive.count({ where: { predictionStatus: 'pending' } }),
      prisma.fateArchive.count({ where: { predictionStatus: 'unfulfilled' } }),
      prisma.user.findMany({
        where: { isDeleted: false },
        orderBy: { longestStreak: 'desc' },
        take: 10,
        select: { id: true, nickname: true, longestStreak: true },
      }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo }, isDeleted: false } }),
      prisma.fateArchive.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.chatContext.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.dailyFortune.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ]);

    const totalPredictions = fulfilledPredictions + unfulfilledPredictions;
    const accuracyRate = totalPredictions > 0
      ? Math.round((fulfilledPredictions / totalPredictions) * 100)
      : null;

    // Growth vs last 7 days (approximate: compare last 7d to previous 7d)
    const prev7DaysStart = new Date(sevenDaysAgo);
    prev7DaysStart.setDate(prev7DaysStart.getDate() - 7);
    const [usersPrev7Days, readingsPrev7Days] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: prev7DaysStart, lt: sevenDaysAgo }, isDeleted: false } }),
      prisma.fateArchive.count({ where: { createdAt: { gte: prev7DaysStart, lt: sevenDaysAgo } } }),
    ]);

    const userGrowth = usersPrev7Days > 0
      ? Math.round(((usersLast7Days - usersPrev7Days) / usersPrev7Days) * 100)
      : usersLast7Days > 0 ? 100 : 0;
    const totalReadingLast7Days = readingsLast7Days + fortuneCountLast7Days + chatsLast7Days;
    const totalReadingPrev7Days = readingsPrev7Days;
    const readingGrowth = totalReadingPrev7Days > 0
      ? Math.round(((totalReadingLast7Days - totalReadingPrev7Days) / totalReadingPrev7Days) * 100)
      : totalReadingLast7Days > 0 ? 100 : 0;

    res.json({
      totalUsers,
      newUsersToday,
      activeUsersToday,
      deletedUsers,
      adminCount,
      totalReadings,
      totalFortunes,
      totalChatSessions,
      fulfilledPredictions,
      pendingPredictions,
      accuracyRate,
      userGrowth,
      readingGrowth,
      topStreakUsers: usersByStreak,
    });
  } catch (err) {
    console.error('Admin dashboard stats error:', err);
    res.status(500).json({ message: '获取统计数据失败' });
  }
});

// GET /api/v1/admin/dashboard/user-growth
router.get('/dashboard/user-growth', async (req: Request, res: Response) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      where: { createdAt: { gte: startDate }, isDeleted: false },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const dailyCounts: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      dailyCounts[d.toISOString().split('T')[0]] = 0;
    }
    for (const u of users) {
      const key = u.createdAt.toISOString().split('T')[0];
      if (dailyCounts[key] !== undefined) dailyCounts[key]++;
    }

    res.json(Object.entries(dailyCounts).map(([date, count]) => ({ date, count })));
  } catch (err) {
    console.error('Admin user growth error:', err);
    res.status(500).json({ message: '获取用户增长趋势失败' });
  }
});

// GET /api/v1/admin/dashboard/reading-trend
router.get('/dashboard/reading-trend', async (req: Request, res: Response) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const [archives, fortunes] = await Promise.all([
      prisma.fateArchive.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
      prisma.dailyFortune.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
    ]);

    const dailyData: Record<string, { tarot: number; fortune: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      dailyData[d.toISOString().split('T')[0]] = { tarot: 0, fortune: 0 };
    }

    for (const a of archives) {
      const key = a.createdAt.toISOString().split('T')[0];
      if (dailyData[key]) dailyData[key].tarot++;
    }
    for (const f of fortunes) {
      const key = f.createdAt.toISOString().split('T')[0];
      if (dailyData[key]) dailyData[key].fortune++;
    }

    res.json(Object.entries(dailyData).map(([date, v]) => ({ date, ...v })));
  } catch (err) {
    console.error('Admin reading trend error:', err);
    res.status(500).json({ message: '获取占卜趋势失败' });
  }
});

export default router;
