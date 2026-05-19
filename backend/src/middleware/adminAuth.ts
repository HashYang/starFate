import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: '未提供认证令牌' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.adminJwt.secret) as { userId: string; role: string };

    // Double-check role in DB to handle demotion after token issuance
    prisma.user.findFirst({
      where: { id: payload.userId, role: 'admin', isDeleted: false },
      select: { id: true },
    }).then((user) => {
      if (!user) {
        res.status(403).json({ message: '无权访问管理后台' });
        return;
      }
      req.user = { userId: user.id };
      next();
    }).catch(() => {
      res.status(500).json({ message: '服务器错误' });
    });
  } catch {
    res.status(401).json({ message: '认证令牌无效或已过期' });
  }
}
