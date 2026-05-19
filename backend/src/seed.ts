import { PrismaClient } from '@prisma/client';
import { hashPassword } from './services/authService';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'admin@starfate.app';
  const password = process.argv[3] || 'admin123456';
  const nickname = process.argv[4] || '管理员';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === 'admin') {
      console.log('管理员账号已存在:', existing.email);
    } else {
      // Upgrade to admin
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'admin' },
      });
      console.log('用户已升级为管理员:', existing.email);
    }
    return;
  }

  const admin = await prisma.user.create({
    data: {
      nickname,
      email,
      passwordHash: hashPassword(password),
      authProvider: 'email',
      role: 'admin',
      birthDate: new Date('2000-01-01'),
    },
  });

  console.log('管理员账号创建成功:');
  console.log('  邮箱:', admin.email);
  console.log('  密码:', password);
  console.log('  昵称:', admin.nickname);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
