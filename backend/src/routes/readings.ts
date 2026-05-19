import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { readingRateLimit } from '../middleware/rateLimit';
import { generateTarotReading, generateDailyFortune } from '../services/aiService';

const router = Router();
const prisma = new PrismaClient();

// All reading routes require auth
router.use(authMiddleware);

// POST /api/v1/readings/tarot
router.post('/tarot', readingRateLimit, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      question: z.string().min(1).max(500),
      spreadId: z.string(),
      userId: z.string(),
    });
    const data = schema.parse(req.body);

    if (req.user?.userId !== data.userId) {
      res.status(403).json({ message: '无权访问' });
      return;
    }

    // Fetch user info for context
    const user = await prisma.user.findUnique({ where: { id: data.userId } });

    // Generate cards based on spread
    const spread = getSpread(data.spreadId);
    const cards = generateCards(spread.cardCount);

    // Get AI interpretation
    const reading = await generateTarotReading({
      question: data.question,
      cards,
      spreadName: spread.nameCn,
      userContext: user ? {
        constellation: user.constellation || undefined,
        chineseZodiac: user.chineseZodiac || undefined,
        previousReadings: user.totalReadings,
        birthDate: user.birthDate.toISOString(),
      } : undefined,
    });

    // Save to archive
    const archive = await prisma.fateArchive.create({
      data: {
        userId: data.userId,
        type: 'tarot',
        question: data.question,
        readingResult: JSON.stringify(reading),
        aiInterpretation: reading.details,
        aiAdvice: reading.advice,
        cards: JSON.stringify(cards),
        spreadName: spread.nameCn,
        tags: JSON.stringify(generateTags(data.question, cards)),
        predictionStatus: 'pending',
      },
    });

    // Update user streak
    await prisma.user.update({
      where: { id: data.userId },
      data: { totalReadings: { increment: 1 } },
    });

    res.json({
      sessionId: archive.id,
      question: data.question,
      cards,
      interpretation: reading.details,
      advice: reading.advice,
      score: reading.score,
      spreadName: spread.nameCn,
      archivedId: archive.id,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误', errors: err.errors });
      return;
    }
    console.error('Tarot reading error:', err);
    res.status(500).json({ message: '占卜失败，请稍后再试' });
  }
});

// GET /api/v1/readings/daily-fortune/:userId
router.get('/daily-fortune/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (req.user?.userId !== userId) {
      res.status(403).json({ message: '无权访问' });
      return;
    }

    // Check if today's fortune already exists
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await prisma.dailyFortune.findFirst({
      where: {
        userId,
        date: { gte: today, lt: tomorrow },
      },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: '用户不存在' });
      return;
    }

    if (existing) {
      // Patch missing divineSign on cached fortunes (schema migration compat)
      if (!existing.divineSign) {
        const { HEAVENLY_STEMS, EARTHLY_BRANCHES, getDayGanzhi, getMonthGanzhi, generateDivineSign } = await import('../services/aiService');
        const yearStem = 2; // 2026 = 丙午
        const yearBranch = 6;
        const dayGanzhi = getDayGanzhi(new Date());
        const monthGanzhi = getMonthGanzhi(new Date(), yearStem);
        const seed = (user.birthHour ?? 0) + (user.chineseZodiac?.charCodeAt(0) ?? 0) + new Date().toISOString().slice(0, 10).split('').reduce((s: number, c: string) => s + c.charCodeAt(0), 0);
        const divineSign = generateDivineSign({
          constellation: user.constellation || '',
          chineseZodiac: user.chineseZodiac || '',
          birthHour: user.birthHour || undefined,
          birthPlace: user.birthPlace || undefined,
        }, seed);
        await prisma.dailyFortune.update({
          where: { id: existing.id },
          data: { divineSign: JSON.stringify(divineSign) },
        });
        existing.divineSign = JSON.stringify(divineSign);
      }
      res.json(formatFortune(existing, user));
      return;
    }

    const fortune = await generateDailyFortune({
      constellation: user.constellation || '未知',
      chineseZodiac: user.chineseZodiac || '未知',
      birthDate: user.birthDate.toISOString(),
      birthHour: user.birthHour || undefined,
      birthPlace: user.birthPlace || undefined,
    });

    const saved = await prisma.dailyFortune.create({
      data: {
        userId,
        date: today,
        overallScore: fortune.overallScore,
        categories: JSON.stringify(fortune.categories),
        generalAdvice: fortune.generalAdvice,
        luckyColor: fortune.luckyColor,
        luckyNumber: fortune.luckyNumber,
        luckyDirection: fortune.luckyDirection,
        luckyTime: fortune.luckyTime,
        poemLine: fortune.poemLine,
        poemInterpretation: fortune.poemInterpretation,
        reminders: JSON.stringify(fortune.reminders),
        yi: JSON.stringify(fortune.yi),
        ji: JSON.stringify(fortune.ji),
        divineSign: JSON.stringify(fortune.divineSign),
      },
    });

    // Save to archive as well
    await prisma.fateArchive.create({
      data: {
        userId,
        type: 'dailyFortune',
        question: '今日运势',
        readingResult: JSON.stringify(fortune),
        aiInterpretation: fortune.generalAdvice,
        tags: JSON.stringify(['每日运势']),
      },
    });

    res.json(formatFortune(saved, user));
  } catch (err) {
    console.error('Daily fortune error:', err);
    res.status(500).json({ message: '获取运势失败' });
  }
});

function formatFortune(f: any, user: { constellation: string | null; chineseZodiac: string | null }) {
  return {
    ...f,
    categories: JSON.parse(f.categories),
    reminders: JSON.parse(f.reminders),
    yi: JSON.parse(f.yi),
    ji: JSON.parse(f.ji),
    divineSign: f.divineSign ? JSON.parse(f.divineSign) : null,
    constellation: user.constellation,
    chineseZodiac: user.chineseZodiac,
  };
}

// ===== Helpers =====

function getSpread(spreadId: string): { nameCn: string; cardCount: number } {
  const spreads: Record<string, { nameCn: string; cardCount: number }> = {
    single: { nameCn: '单牌指引', cardCount: 1 },
    three: { nameCn: '三牌展开', cardCount: 3 },
    celtic: { nameCn: '凯尔特十字', cardCount: 10 },
  };
  return spreads[spreadId] || spreads.three;
}

// Full 78-card tarot deck for random selection
const ALL_TAROT_CARDS = [
  // Major Arcana
  { name: 'The Fool', nameCn: '愚者', suit: 'major', keyword: '新的开始', reversedKeyword: '冒险鲁莽', meaningLove: '新的恋情机会', meaningCareer: '新的工作机会', meaningWealth: '大胆投资' },
  { name: 'The Magician', nameCn: '魔术师', suit: 'major', keyword: '创造', reversedKeyword: '能力不足', meaningLove: '主动追求', meaningCareer: '展现才华', meaningWealth: '技能变现' },
  { name: 'The High Priestess', nameCn: '女祭司', suit: 'major', keyword: '直觉', reversedKeyword: '忽视直觉', meaningLove: '等待时机', meaningCareer: '内在智慧', meaningWealth: '稳健理财' },
  { name: 'The Empress', nameCn: '女皇', suit: 'major', keyword: '丰收', reversedKeyword: '依赖他人', meaningLove: '感情稳定', meaningCareer: '事业有成', meaningWealth: '物质丰富' },
  { name: 'The Emperor', nameCn: '皇帝', suit: 'major', keyword: '稳定', reversedKeyword: '控制欲强', meaningLove: '保护者', meaningCareer: '领导力', meaningWealth: '财富积累' },
  { name: 'The Hierophant', nameCn: '教皇', suit: 'major', keyword: '传统', reversedKeyword: '打破规则', meaningLove: '结婚', meaningCareer: '贵人相助', meaningWealth: '稳定收入' },
  { name: 'The Lovers', nameCn: '恋人', suit: 'major', keyword: '选择', reversedKeyword: '分离', meaningLove: '热恋', meaningCareer: '合伙', meaningWealth: '合作生财' },
  { name: 'The Chariot', nameCn: '战车', suit: 'major', keyword: '胜利', reversedKeyword: '失去控制', meaningLove: '主动出击', meaningCareer: '突破', meaningWealth: '努力得财' },
  { name: 'Strength', nameCn: '力量', suit: 'major', keyword: '内在力量', reversedKeyword: '软弱', meaningLove: '以柔克刚', meaningCareer: '耐心', meaningWealth: '持久理财' },
  { name: 'The Hermit', nameCn: '隐士', suit: 'major', keyword: '内省', reversedKeyword: '孤独', meaningLove: '单身期', meaningCareer: '反思', meaningWealth: '财务规划' },
  { name: 'Wheel of Fortune', nameCn: '命运之轮', suit: 'major', keyword: '转变', reversedKeyword: '厄运', meaningLove: '缘分', meaningCareer: '机遇', meaningWealth: '财运起伏' },
  { name: 'Justice', nameCn: '正义', suit: 'major', keyword: '平衡', reversedKeyword: '不公', meaningLove: '公平对待', meaningCareer: '法律事务', meaningWealth: '合理分配' },
  { name: 'The Hanged Man', nameCn: '倒吊人', suit: 'major', keyword: '等待', reversedKeyword: '拖延', meaningLove: '牺牲', meaningCareer: '新视角', meaningWealth: '暂停消费' },
  { name: 'Death', nameCn: '死神', suit: 'major', keyword: '结束', reversedKeyword: '抗拒改变', meaningLove: '感情转变', meaningCareer: '重新开始', meaningWealth: '财务重组' },
  { name: 'Temperance', nameCn: '节制', suit: 'major', keyword: '调和', reversedKeyword: '失衡', meaningLove: '磨合', meaningCareer: '稳健', meaningWealth: '收支平衡' },
  { name: 'The Devil', nameCn: '恶魔', suit: 'major', keyword: '执着', reversedKeyword: '解放', meaningLove: '欲望', meaningCareer: '物质束缚', meaningWealth: '贪欲警示' },
  { name: 'The Tower', nameCn: '高塔', suit: 'major', keyword: '剧变', reversedKeyword: '避免灾难', meaningLove: '分手', meaningCareer: '失业', meaningWealth: '破产' },
  { name: 'The Star', nameCn: '星星', suit: 'major', keyword: '希望', reversedKeyword: '绝望', meaningLove: '疗愈', meaningCareer: '灵感', meaningWealth: '新的财源' },
  { name: 'The Moon', nameCn: '月亮', suit: 'major', keyword: '恐惧', reversedKeyword: '释然', meaningLove: '欺骗', meaningCareer: '不确定', meaningWealth: '虚假机会' },
  { name: 'The Sun', nameCn: '太阳', suit: 'major', keyword: '快乐', reversedKeyword: '暂时的阴霾', meaningLove: '美满', meaningCareer: '成功', meaningWealth: '财运亨通' },
  { name: 'Judgement', nameCn: '审判', suit: 'major', keyword: '觉醒', reversedKeyword: '自我怀疑', meaningLove: '复合', meaningCareer: '升职', meaningWealth: '重新评估' },
  { name: 'The World', nameCn: '世界', suit: 'major', keyword: '完成', reversedKeyword: '未竟之事', meaningLove: '圆满', meaningCareer: '达成目标', meaningWealth: '财务自由' },
  // Minor Arcana - samples
  { name: 'Ace of Cups', nameCn: '圣杯ace', suit: 'cups', keyword: '爱的开始', reversedKeyword: '情感空虚', meaningLove: '新恋情', meaningCareer: '情感满足', meaningWealth: '情感财富' },
  { name: 'Two of Cups', nameCn: '圣杯二', suit: 'cups', keyword: '结合', reversedKeyword: '分离', meaningLove: '恋爱关系', meaningCareer: '合作', meaningWealth: '双赢' },
  { name: 'Ten of Cups', nameCn: '圣杯十', suit: 'cups', keyword: '幸福', reversedKeyword: '家庭矛盾', meaningLove: '美满家庭', meaningCareer: '和谐', meaningWealth: '情感富足' },
  { name: 'Ace of Wands', nameCn: '权杖ace', suit: 'wands', keyword: '行动', reversedKeyword: '延迟', meaningLove: '主动追求', meaningCareer: '新项目', meaningWealth: '新的收入' },
  { name: 'Six of Wands', nameCn: '权杖六', suit: 'wands', keyword: '胜利', reversedKeyword: '失败', meaningLove: '被认可', meaningCareer: '晋升', meaningWealth: '丰厚回报' },
  { name: 'Ten of Wands', nameCn: '权杖十', suit: 'wands', keyword: '压力', reversedKeyword: '放下负担', meaningLove: '负担重', meaningCareer: '过度工作', meaningWealth: '负担' },
  { name: 'Ace of Swords', nameCn: '宝剑ace', suit: 'swords', keyword: '清晰', reversedKeyword: '困惑', meaningLove: '看清真相', meaningCareer: '新的想法', meaningWealth: '明智决策' },
  { name: 'Three of Swords', nameCn: '宝剑三', suit: 'swords', keyword: '伤痛', reversedKeyword: '疗愈', meaningLove: '心碎', meaningCareer: '冲突', meaningWealth: '损失' },
  { name: 'Ten of Swords', nameCn: '宝剑十', suit: 'swords', keyword: '低谷', reversedKeyword: '复苏', meaningLove: '结束', meaningCareer: '失败', meaningWealth: '财务危机' },
  { name: 'Ace of Pentacles', nameCn: '星币ace', suit: 'pentacles', keyword: '富足', reversedKeyword: '错失机会', meaningLove: '稳定', meaningCareer: '新工作', meaningWealth: '新的投资' },
  { name: 'Ten of Pentacles', nameCn: '星币十', suit: 'pentacles', keyword: '传承', reversedKeyword: '财务损失', meaningLove: '家庭', meaningCareer: '长期稳定', meaningWealth: '遗产继承' },
  { name: 'Page of Pentacles', nameCn: '星币侍从', suit: 'pentacles', keyword: '学习', reversedKeyword: '拖延', meaningLove: '务实', meaningCareer: '实习', meaningWealth: '开始储蓄' },
];

function generateCards(count: number) {
  const shuffled = [...ALL_TAROT_CARDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((card) => ({
    ...card,
    isReversed: Math.random() > 0.7, // 30% chance reversed
  }));
}

function generateTags(question: string, cards: Array<{ nameCn: string }>): string[] {
  const tags: string[] = ['塔罗占卜'];
  const questionLower = question.toLowerCase();

  const topicMap: Record<string, string[]> = {
    '感情': ['love', '感情', '爱情', '恋爱', '婚姻'],
    '事业': ['career', '事业', '工作', '职场', '升职'],
    '财运': ['wealth', '财运', '金钱', '投资', '财务'],
    '健康': ['health', '健康', '身体'],
    '学业': ['study', '学业', '考试', '学习'],
  };

  for (const [tag, keywords] of Object.entries(topicMap)) {
    if (keywords.some((k) => questionLower.includes(k))) {
      tags.push(tag);
    }
  }

  // Add card name tags
  cards.slice(0, 2).forEach((c) => tags.push(c.nameCn));

  return tags;
}

export default router;
