import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ArchiveStats {
  totalReadings: number;
  totalCardsDrawn: number;
  fulfilledPredictions: number;
  pendingPredictions: number;
  accuracyRate: number;
  topTags: Array<{ tag: string; count: number }>;
  streakDays: number;
  longestStreak: number;
  memberDays: number;
  readingsByMonth: Array<{ month: string; count: number; primaryType: string }>;
  commonCards: Array<{ card: string; count: number }>;
}

export async function getArchiveStats(userId: string): Promise<ArchiveStats> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const archives = await prisma.fateArchive.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const totalReadings = archives.length;
  const fulfilledPredictions = archives.filter((a) => a.predictionStatus === 'fulfilled').length;
  const pendingPredictions = archives.filter((a) => a.predictionStatus === 'pending').length;
  const nonPending = archives.filter((a) => a.predictionStatus !== 'pending' && a.predictionStatus !== null);
  const accuracyRate = nonPending.length > 0
    ? fulfilledPredictions / nonPending.length
    : 0;

  // Tag aggregation
  const tagCount = new Map<string, number>();
  archives.forEach((a) => JSON.parse(a.tags).forEach((t: string) => tagCount.set(t, (tagCount.get(t) || 0) + 1)));
  const topTags = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Monthly readings
  const monthlyMap = new Map<string, { count: number; types: Map<string, number> }>();
  archives.forEach((a) => {
    const month = a.createdAt.toISOString().slice(0, 7);
    if (!monthlyMap.has(month)) monthlyMap.set(month, { count: 0, types: new Map() });
    const entry = monthlyMap.get(month)!;
    entry.count++;
    entry.types.set(a.type, (entry.types.get(a.type) || 0) + 1);
  });
  const readingsByMonth = [...monthlyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      count: data.count,
      primaryType: [...data.types.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'tarot',
    }));

  // Card frequency (from JSON field)
  const cardCount = new Map<string, number>();
  archives.forEach((a) => {
    const cards = a.cards ? JSON.parse(a.cards) as Array<{ nameCn: string }> : null;
    if (cards) cards.forEach((c) => cardCount.set(c.nameCn, (cardCount.get(c.nameCn) || 0) + 1));
  });
  const commonCards = [...cardCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([card, count]) => ({ card, count }));

  return {
    totalReadings,
    totalCardsDrawn: archives.reduce((sum, a) => sum + ((a.cards ? JSON.parse(a.cards) as Array<unknown> : null)?.length || 0), 0),
    fulfilledPredictions,
    pendingPredictions,
    accuracyRate,
    topTags,
    streakDays: user.currentStreak,
    longestStreak: user.longestStreak,
    memberDays: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    readingsByMonth,
    commonCards,
  };
}

export async function getTimeline(userId: string) {
  const archives = await prisma.fateArchive.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      createdAt: true,
      type: true,
      question: true,
      predictionStatus: true,
      readingResult: true,
    },
  });

  // Inject milestone entries (e.g., every 10 readings)
  const timeline: Array<Record<string, unknown>> = [];
  archives.forEach((a, idx) => {
    timeline.push({
      id: a.id,
      date: a.createdAt,
      type: a.type,
      summary: a.question.substring(0, 60),
      predictionStatus: a.predictionStatus,
      score: JSON.parse(a.readingResult)?.score || null,
      isMilestone: false,
      milestoneTitle: null,
    });

    // Add milestone
    const readingNumber = archives.length - idx;
    if (readingNumber % 10 === 0 && readingNumber > 0) {
      timeline.push({
        id: `milestone-${readingNumber}`,
        date: a.createdAt,
        type: 'milestone',
        summary: `完成了第 ${readingNumber} 次占卜！`,
        predictionStatus: null,
        score: null,
        isMilestone: true,
        milestoneTitle: `🎉 ${readingNumber}次占卜里程碑`,
      });
    }
  });

  return timeline;
}

export async function updateStreak(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const lastActive = user.lastActiveAt;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastActiveDay = lastActive.toISOString().split('T')[0];
  const yesterdayDay = yesterday.toISOString().split('T')[0];
  const todayDay = today.toISOString().split('T')[0];

  let newStreak = user.currentStreak;

  if (lastActiveDay === todayDay) {
    // Already active today, no change
    return;
  } else if (lastActiveDay === yesterdayDay) {
    // Consecutive day
    newStreak += 1;
  } else {
    // Streak broken
    newStreak = 1;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(user.longestStreak, newStreak),
      totalReadings: { increment: 1 },
    },
  });
}
