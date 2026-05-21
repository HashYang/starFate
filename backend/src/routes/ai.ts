import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { chatWithFortuneteller } from '../services/aiService';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// POST /api/v1/ai/chat — Chat with the AI fortuneteller
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      message: z.string().min(1).max(1000),
      userId: z.string(),
      contextId: z.string().optional(),
      divinationContext: z.string().optional(),
    });
    const data = schema.parse(req.body);

    if (req.user?.userId !== data.userId) {
      res.status(403).json({ message: '无权访问' });
      return;
    }

    // Load or create context
    let contextMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (data.contextId) {
      const existing = await prisma.chatContext.findUnique({
        where: { contextId: data.contextId },
      });
      if (existing) {
        contextMessages = JSON.parse(existing.messages).slice(-20);
      }
    }

    // Get user info for context
    const user = await prisma.user.findUnique({ where: { id: data.userId } });

    // Get AI response
    const reply = await chatWithFortuneteller(data.message, contextMessages, {
      constellation: user?.constellation || undefined,
      chineseZodiac: user?.chineseZodiac || undefined,
    }, data.divinationContext);

    // Save context
    const newMessages = [
      ...contextMessages,
      { role: 'user' as const, content: data.message },
      { role: 'assistant' as const, content: reply },
    ];

    const contextId = data.contextId || `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await prisma.chatContext.upsert({
      where: { contextId },
      update: { messages: JSON.stringify(newMessages) },
      create: {
        userId: data.userId,
        contextId,
        messages: JSON.stringify(newMessages),
      },
    });

    res.json({ reply, contextId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误' });
      return;
    }
    console.error('Chat error:', err);
    res.status(500).json({ message: '对话失败，请稍后再试' });
  }
});

// GET /api/v1/ai/chat/history/:userId — Get latest chat history for a user
router.get('/chat/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (req.user?.userId !== userId) {
      res.status(403).json({ message: '无权访问' });
      return;
    }

    const latest = await prisma.chatContext.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    if (!latest) {
      res.json({ messages: [], contextId: null });
      return;
    }

    const messages = JSON.parse(latest.messages).slice(-50);
    res.json({ messages, contextId: latest.contextId });
  } catch (err) {
    console.error('Chat history error:', err);
    res.status(500).json({ message: '获取历史记录失败' });
  }
});

export default router;
