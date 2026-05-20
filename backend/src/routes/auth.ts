import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import { config } from '../config';
import { hashPassword, verifyPassword, verifyGoogleToken, verifyAppleToken } from '../services/authService';
import { sendVerificationCodeEmail } from '../services/emailService';

const router = Router();
const prisma = new PrismaClient();

function signToken(userId: string): string {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

// ── Schemas ──

const registerSchema = z.object({
  nickname: z.string().min(1).max(30),
  birthDate: z.string().transform((s) => new Date(s)),
  birthHour: z.number().int().min(0).max(23).optional(),
  birthPlace: z.string().optional(),
  gender: z.string().optional(),
});

const emailRegisterSchema = registerSchema.extend({
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

const emailLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const oauthSchema = z.object({
  idToken: z.string().min(1),
  nickname: z.string().min(1).max(30).optional(),
  birthDate: z.string().transform((s) => new Date(s)).optional(),
  birthHour: z.number().int().min(0).max(23).optional(),
  birthPlace: z.string().optional(),
  gender: z.string().optional(),
});

const linkPasswordSchema = z.object({
  userId: z.string(),
  password: z.string().min(6).max(100),
});

// ── Helpers ──

function calculateZodiac(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const zodiacs = [
    { name: '摩羯座', start: [1, 1], end: [1, 19] },
    { name: '水瓶座', start: [1, 20], end: [2, 18] },
    { name: '双鱼座', start: [2, 19], end: [3, 20] },
    { name: '白羊座', start: [3, 21], end: [4, 19] },
    { name: '金牛座', start: [4, 20], end: [5, 20] },
    { name: '双子座', start: [5, 21], end: [6, 21] },
    { name: '巨蟹座', start: [6, 22], end: [7, 22] },
    { name: '狮子座', start: [7, 23], end: [8, 22] },
    { name: '处女座', start: [8, 23], end: [9, 22] },
    { name: '天秤座', start: [9, 23], end: [10, 23] },
    { name: '天蝎座', start: [10, 24], end: [11, 21] },
    { name: '射手座', start: [11, 22], end: [12, 21] },
    { name: '摩羯座', start: [12, 22], end: [12, 31] },
  ];
  const z = zodiacs.find((z) => {
    const s = z.start[0] < month || (z.start[0] === month && day >= z.start[1]);
    const e = z.end[0] > month || (z.end[0] === month && day <= z.end[1]);
    return s && e;
  });
  return z?.name || '未知';
}

function calculateConstellation(date: Date): string {
  return calculateZodiac(date);
}

function calculateChineseZodiac(year: number): string {
  const animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
  return animals[(year - 4) % 12];
}

function computeDerivedFields(birthDate: Date) {
  return {
    zodiac: calculateZodiac(birthDate),
    constellation: calculateConstellation(birthDate),
    chineseZodiac: calculateChineseZodiac(birthDate.getFullYear()),
  };
}

// ── Legacy endpoints (backward compat) ──

// POST /api/v1/auth/register — legacy register (no email/password)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const user = await prisma.user.create({
      data: {
        nickname: data.nickname,
        birthDate: data.birthDate,
        birthHour: data.birthHour,
        birthPlace: data.birthPlace,
        gender: data.gender,
        authProvider: 'legacy',
        ...computeDerivedFields(data.birthDate),
      },
    });
    const token = signToken(user.id);
    res.status(201).json({ token, user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误', errors: err.errors });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ message: '注册失败' });
  }
});

// POST /api/v1/auth/login — legacy login (by user id)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ message: '用户不存在' });
      return;
    }
    const token = signToken(user.id);
    res.json({ token, user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误' });
      return;
    }
    console.error('Login error:', err);
    res.status(500).json({ message: '登录失败' });
  }
});

// ── New endpoints ──

// POST /api/v1/auth/email/register
router.post('/email/register', async (req: Request, res: Response) => {
  try {
    const data = emailRegisterSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(409).json({ message: '该邮箱已被注册' });
      return;
    }

    const passwordHash = hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        nickname: data.nickname,
        birthDate: data.birthDate,
        birthHour: data.birthHour,
        birthPlace: data.birthPlace,
        gender: data.gender,
        email: data.email,
        passwordHash,
        authProvider: 'email',
        ...computeDerivedFields(data.birthDate),
      },
    });
    const token = signToken(user.id);
    res.status(201).json({ token, user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误', errors: err.errors });
      return;
    }
    console.error('Email register error:', err);
    res.status(500).json({ message: '注册失败' });
  }
});

// POST /api/v1/auth/email/login
router.post('/email/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = emailLoginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      res.status(401).json({ message: '邮箱或密码错误' });
      return;
    }
    if (!verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ message: '邮箱或密码错误' });
      return;
    }
    const token = signToken(user.id);
    res.json({ token, user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误' });
      return;
    }
    console.error('Email login error:', err);
    res.status(500).json({ message: '登录失败' });
  }
});

// POST /api/v1/auth/oauth/google
router.post('/oauth/google', async (req: Request, res: Response) => {
  try {
    const { idToken, nickname, birthDate, birthHour, birthPlace, gender } = oauthSchema.parse(req.body);
    const tokenPayload = await verifyGoogleToken(idToken);

    // Find existing user by authProviderId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { authProviderId: tokenPayload.sub },
          { email: tokenPayload.email },
        ],
      },
    });

    if (user) {
      // Link authProviderId if not set
      if (!user.authProviderId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { authProviderId: tokenPayload.sub, email: tokenPayload.email, authProvider: 'google' },
        });
      }
    } else {
      // Create new user
      if (!nickname || !birthDate) {
        res.status(400).json({ message: '首次登录需要提供昵称和出生日期', needsProfile: true, email: tokenPayload.email });
        return;
      }
      user = await prisma.user.create({
        data: {
          nickname,
          birthDate: birthDate!,
          birthHour,
          birthPlace,
          gender,
          email: tokenPayload.email,
          authProvider: 'google',
          authProviderId: tokenPayload.sub,
          ...computeDerivedFields(birthDate!),
        },
      });
    }

    const token = signToken(user.id);
    res.json({ token, user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误', errors: err.errors });
      return;
    }
    console.error('Google OAuth error:', err);
    res.status(500).json({ message: 'Google 登录失败' });
  }
});

// POST /api/v1/auth/oauth/apple
router.post('/oauth/apple', async (req: Request, res: Response) => {
  try {
    const { idToken, nickname, birthDate, birthHour, birthPlace, gender } = oauthSchema.parse(req.body);
    const tokenPayload = await verifyAppleToken(idToken);

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { authProviderId: tokenPayload.sub },
          { email: tokenPayload.email },
        ],
      },
    });

    if (user) {
      if (!user.authProviderId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { authProviderId: tokenPayload.sub, email: tokenPayload.email, authProvider: 'apple' },
        });
      }
    } else {
      if (!nickname || !birthDate) {
        res.status(400).json({ message: '首次登录需要提供昵称和出生日期', needsProfile: true, email: tokenPayload.email });
        return;
      }
      user = await prisma.user.create({
        data: {
          nickname,
          birthDate: birthDate!,
          birthHour,
          birthPlace,
          gender,
          email: tokenPayload.email,
          authProvider: 'apple',
          authProviderId: tokenPayload.sub,
          ...computeDerivedFields(birthDate!),
        },
      });
    }

    const token = signToken(user.id);
    res.json({ token, user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误', errors: err.errors });
      return;
    }
    console.error('Apple OAuth error:', err);
    res.status(500).json({ message: 'Apple 登录失败' });
  }
});

// POST /api/v1/auth/link-password — OAuth 用户设置密码
router.post('/link-password', async (req: Request, res: Response) => {
  try {
    const { userId, password } = linkPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: '用户不存在' });
      return;
    }
    if (user.passwordHash) {
      res.status(409).json({ message: '已设置密码' });
      return;
    }
    const passwordHash = hashPassword(password);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    res.json({ message: '密码设置成功' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误', errors: err.errors });
      return;
    }
    console.error('Link password error:', err);
    res.status(500).json({ message: '设置密码失败' });
  }
});

// ── Verification Code Store (in-memory, use Redis in production) ──

interface CodeRecord {
  hash: string;
  expiresAt: Date;
  attempts: number;
}
const codeStore = new Map<string, CodeRecord>();
// Tracks emails that passed verify-code step (for new user profile completion)
const verifiedEmails = new Set<string>();
// Auto-clean verified emails after 10 minutes
setInterval(() => verifiedEmails.clear(), 10 * 60_000);

const SEND_COOLDOWN_MS = 60_000;   // 60s between sends
const CODE_TTL_MS = 10 * 60_000;    // 10 min expiry
const MAX_ATTEMPTS = 5;
const VERIFICATION_CODE_SALT = 'sf-v1-';

function hashVerificationCode(code: string): string {
  return crypto.createHash('sha256').update(VERIFICATION_CODE_SALT + code).digest('hex');
}

function generateCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

function cleanupExpiredCodes(): void {
  const now = new Date();
  for (const [key, record] of codeStore) {
    if (record.expiresAt < now) codeStore.delete(key);
  }
}
// Cleanup every 5 minutes
setInterval(cleanupExpiredCodes, 5 * 60_000);

// ── Code schemas ──

const sendCodeSchema = z.object({
  email: z.string().email(),
});

const verifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

const completeProfileSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  nickname: z.string().min(1).max(30),
  birthDate: z.string().transform((s) => new Date(s)),
  birthHour: z.number().int().min(0).max(23).optional(),
  birthPlace: z.string().optional(),
  gender: z.string().optional(),
});

// POST /api/v1/auth/email/send-code
router.post('/email/send-code', async (req: Request, res: Response) => {
  try {
    const { email } = sendCodeSchema.parse(req.body);

    // Rate limit: check cooldown
    const existing = codeStore.get(email);
    if (existing) {
      const elapsed = Date.now() - (existing.expiresAt.getTime() - CODE_TTL_MS);
      if (elapsed < SEND_COOLDOWN_MS) {
        const remain = Math.ceil((SEND_COOLDOWN_MS - elapsed) / 1000);
        res.status(429).json({ message: `请 ${remain} 秒后再发送` });
        return;
      }
    }

    // Check if email belongs to an existing deleted user
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.isDeleted) {
      res.status(403).json({ message: '该账号已被删除' });
      return;
    }

    const code = generateCode();
    codeStore.set(email, {
      hash: hashVerificationCode(code),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
      attempts: 0,
    });

    await sendVerificationCodeEmail(email, code);
    res.json({ message: '验证码已发送' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '请输入有效的邮箱地址' });
      return;
    }
    console.error('Send code error:', err);
    res.status(500).json({ message: '验证码发送失败' });
  }
});

// POST /api/v1/auth/email/verify-code
router.post('/email/verify-code', async (req: Request, res: Response) => {
  try {
    const { email, code } = verifyCodeSchema.parse(req.body);

    const record = codeStore.get(email);
    if (!record) {
      res.status(400).json({ message: '请先获取验证码' });
      return;
    }
    if (record.expiresAt < new Date()) {
      codeStore.delete(email);
      res.status(400).json({ message: '验证码已过期，请重新获取' });
      return;
    }
    if (record.attempts >= MAX_ATTEMPTS) {
      codeStore.delete(email);
      res.status(429).json({ message: '验证码错误次数过多，请重新获取' });
      return;
    }

    if (record.hash !== hashVerificationCode(code)) {
      record.attempts += 1;
      const remain = MAX_ATTEMPTS - record.attempts;
      res.status(400).json({ message: `验证码错误，还剩 ${remain} 次机会` });
      return;
    }

    // Code is valid — delete it (single-use)
    codeStore.delete(email);

    // Mark user as emailVerified if exists
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
      const token = signToken(user.id);
      res.json({ token, user });
      return;
    }

    // New user — needs profile completion
    verifiedEmails.add(email);
    res.json({ verified: true, email });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误' });
      return;
    }
    console.error('Verify code error:', err);
    res.status(500).json({ message: '验证失败' });
  }
});

// POST /api/v1/auth/email/complete-profile — 新用户验证码后完善信息
router.post('/email/complete-profile', async (req: Request, res: Response) => {
  try {
    const data = completeProfileSchema.parse(req.body);

    // Code must be provided and verified again (or still valid in store)
    const record = codeStore.get(data.email);
    if (record) {
      // Code still in store means it wasn't used by verify-code first — verify directly
      if (record.expiresAt < new Date()) {
        codeStore.delete(data.email);
        res.status(400).json({ message: '验证码已过期，请重新获取' });
        return;
      }
      if (record.hash !== hashVerificationCode(data.code)) {
        record.attempts += 1;
        const remain = MAX_ATTEMPTS - record.attempts;
        res.status(400).json({ message: `验证码错误，还剩 ${remain} 次机会` });
        return;
      }
      codeStore.delete(data.email);
    } else if (!verifiedEmails.has(data.email)) {
      // No code in store and not pre-verified — reject
      res.status(400).json({ message: '请先验证邮箱' });
      return;
    }

    // Clear the verified flag
    verifiedEmails.delete(data.email);

    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(409).json({ message: '该邮箱已注册' });
      return;
    }

    const user = await prisma.user.create({
      data: {
        nickname: data.nickname,
        birthDate: data.birthDate,
        birthHour: data.birthHour,
        birthPlace: data.birthPlace,
        gender: data.gender,
        email: data.email,
        authProvider: 'email',
        emailVerified: true,
        ...computeDerivedFields(data.birthDate),
      },
    });
    const token = signToken(user.id);
    res.status(201).json({ token, user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误', errors: err.errors });
      return;
    }
    console.error('Complete profile error:', err);
    res.status(500).json({ message: '注册失败' });
  }
});

// ── Temporary: promote user to admin (for production setup) ──

const PROMOTE_SECRET = 'starfate-promote-2026';

router.post('/promote-admin', async (req: Request, res: Response) => {
  try {
    const { email, secret } = z.object({
      email: z.string().email(),
      secret: z.string(),
    }).parse(req.body);

    if (secret !== PROMOTE_SECRET) {
      res.status(403).json({ message: '密钥错误' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ message: '用户不存在' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'admin' },
    });

    res.json({ message: '已升级为管理员', email });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: '参数错误' });
      return;
    }
    console.error('Promote error:', err);
    res.status(500).json({ message: '升级失败' });
  }
});

export default router;
