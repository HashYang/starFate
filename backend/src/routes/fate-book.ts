import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { calculateFate } from '../services/fate-engine';
import { generateFateBookInterpretation } from '../services/aiService';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/v1/fate-book/:userId — Get cached fate book
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (req.user?.userId !== userId) {
      res.status(403).json({ message: '无权访问' });
      return;
    }

    const fateBook = await prisma.fateBook.findUnique({
      where: { userId },
    });

    if (!fateBook) {
      res.status(404).json({ message: '命书尚未生成' });
      return;
    }

    res.json({
      id: fateBook.id,
      userId: fateBook.userId,
      baziData: JSON.parse(fateBook.baziData),
      dayunData: JSON.parse(fateBook.dayunData),
      pattern: fateBook.pattern,
      summary: fateBook.summary,
      personality: fateBook.personality,
      dimensions: JSON.parse(fateBook.dimensions),
      dayunInterpretation: JSON.parse(fateBook.dayunInterpretation),
      liunian: fateBook.liunian ? JSON.parse(fateBook.liunian) : null,
      advice: fateBook.advice,
      details: fateBook.details ? JSON.parse(fateBook.details) : null,
      version: fateBook.version,
      createdAt: fateBook.createdAt,
      updatedAt: fateBook.updatedAt,
    });
  } catch (err) {
    console.error('Get fate book error:', err);
    res.status(500).json({ message: '获取命书失败' });
  }
});

// POST /api/v1/fate-book/generate — Generate or refresh fate book
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      userId: z.string(),
    });
    const data = schema.parse(req.body);

    if (req.user?.userId !== data.userId) {
      res.status(403).json({ message: '无权访问' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      res.status(404).json({ message: '用户不存在' });
      return;
    }

    const birthHour = user.birthHour ?? 0;
    const birthMinute = user.birthMinute ?? 0;

    // Step 1: Calculate with fate-engine (pure algorithm)
    const engineResult = calculateFate(user.birthDate, birthHour, birthMinute, user.gender as 'male' | 'female' | null);

    // Build pillar details for AI
    const bazi = engineResult.bazi;
    const pillarNames = ['年柱', '月柱', '日柱', '时柱'];
    const pillarArr = [bazi.yearPillar, bazi.monthPillar, bazi.dayPillar, bazi.hourPillar];
    const pillars = pillarArr.map((p, i) => ({
      name: pillarNames[i],
      stem: p.stem,
      branch: p.branch,
      stemElement: p.stemElement,
      branchElement: p.branchElement,
      tenGodStem: i === 2 ? '日主' : p.tenGodStem,
      tenGodBranch: p.tenGodBranch,
      hiddenStems: p.hiddenStems,
      dishi: p.dishi,
    }));

    // Step 2: AI interpretation
    const aiResult = await generateFateBookInterpretation({
      baziData: {
        yearPillar: engineResult.bazi.yearPillar.full,
        monthPillar: engineResult.bazi.monthPillar.full,
        dayPillar: engineResult.bazi.dayPillar.full,
        hourPillar: engineResult.bazi.hourPillar.full,
        fiveElements: engineResult.bazi.fiveElements,
        dayStemElement: engineResult.bazi.dayStemElement,
        tenGods: {
          year: engineResult.bazi.yearPillar.tenGodStem,
          month: engineResult.bazi.monthPillar.tenGodStem,
          day: '日主',
          hour: engineResult.bazi.hourPillar.tenGodStem,
        },
        nayin: engineResult.bazi.nayin,
        yongshen: engineResult.bazi.yongshen,
        jishen: engineResult.bazi.jishen,
      },
      dayunData: engineResult.dayun || {
        startAge: 0,
        forward: true,
        periods: [],
      },
      currentDayunIndex: engineResult.currentDayunIndex,
      liunian: engineResult.liunian,
      currentAge: engineResult.currentAge,
      userInfo: {
        birthDate: user.birthDate.toISOString().slice(0, 10),
        birthHour,
        gender: user.gender || 'unknown',
      },
      shensha: bazi.shensha,
      elementStrength: bazi.elementStrength,
      pillars,
    });

    // Build future 3 dayun periods for AI context
    const futureDayunPeriods = engineResult.dayun
      ? engineResult.dayun.periods.slice(
          engineResult.currentDayunIndex ?? 0,
          (engineResult.currentDayunIndex ?? 0) + 3,
        ).map(p => ({
          period: `${p.ganZhi}（${p.startYear}-${p.endYear}）`,
          text: '',
        }))
      : [];

    // Step 3: Cache to DB
    const baseSaveData = {
      baziData: JSON.stringify(engineResult.bazi),
      dayunData: JSON.stringify(engineResult.dayun),
      summary: aiResult.summary,
      pattern: aiResult.pattern || '',
      personality: aiResult.personality || '',
      dimensions: JSON.stringify(aiResult.dimensions),
      dayunInterpretation: JSON.stringify(aiResult.dayunInterpretation),
      liunian: JSON.stringify({ liunian: engineResult.liunian, text: aiResult.liunian }),
      advice: aiResult.advice || '',
    };

    // Build extended details from AI result
    const details: Record<string, any> = {};
    if (aiResult.pillarAnalysis) details.pillarAnalysis = aiResult.pillarAnalysis;
    if (aiResult.hiddenStemAnalysis) details.hiddenStemAnalysis = aiResult.hiddenStemAnalysis;
    if (aiResult.elementAnalysis) details.elementAnalysis = aiResult.elementAnalysis;
    if (aiResult.tenGodAnalysis) details.tenGodAnalysis = aiResult.tenGodAnalysis;
    if (aiResult.deepDive) details.deepDive = aiResult.deepDive;
    if (aiResult.shenshaAnalysis) details.shenshaAnalysis = aiResult.shenshaAnalysis;
    if (aiResult.lifeCurve) details.lifeCurve = aiResult.lifeCurve;
    if (aiResult.keyYears) details.keyYears = aiResult.keyYears;
    if (aiResult.monthlyFortune) details.monthlyFortune = aiResult.monthlyFortune;
    const detailsStr = Object.keys(details).length > 0 ? JSON.stringify(details) : undefined;

    const fateBook = await prisma.fateBook.upsert({
      where: { userId: data.userId },
      update: {
        ...baseSaveData,
        ...(detailsStr ? { details: detailsStr } : {}),
        version: { increment: 1 },
      },
      create: {
        userId: data.userId,
        ...baseSaveData,
        ...(detailsStr ? { details: detailsStr } : {}),
      },
    });

    const parsedDetails = detailsStr ? details : null;

    res.json({
      id: fateBook.id,
      userId: fateBook.userId,
      baziData: JSON.parse(fateBook.baziData),
      dayunData: JSON.parse(fateBook.dayunData),
      pattern: aiResult.pattern,
      summary: aiResult.summary,
      personality: aiResult.personality,
      dimensions: aiResult.dimensions,
      dayunInterpretation: aiResult.dayunInterpretation,
      futureDayun: futureDayunPeriods,
      liunian: { liunian: engineResult.liunian, text: aiResult.liunian },
      advice: aiResult.advice,
      details: parsedDetails,
      version: fateBook.version,
      createdAt: fateBook.createdAt,
      updatedAt: fateBook.updatedAt,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误', errors: err.errors });
      return;
    }
    console.error('Generate fate book error:', err);
    res.status(500).json({ message: '生成命书失败' });
  }
});

export default router;
