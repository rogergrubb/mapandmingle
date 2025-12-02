import { Hono } from 'hono';
import { prisma } from '../index';
// import { sendStreakMilestone } from './notifications';

export const streakRoutes = new Hono();

const STREAK_TYPES = ['login', 'social', 'explorer', 'event'];
const MILESTONES = [3, 7, 14, 30, 50, 100, 365];

// GET /api/streaks - Get user's streaks
streakRoutes.get('/', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    let streaks = await prisma.userStreak.findMany({ where: { userId } });
    
    // Create missing streaks
    for (const type of STREAK_TYPES) {
      if (!streaks.find(s => s.streakType === type)) {
        const newStreak = await prisma.userStreak.create({
          data: { userId, streakType: type },
        });
        streaks.push(newStreak);
      }
    }
    
    const totalScore = streaks.reduce((sum, s) => sum + s.currentStreak, 0);
    const bestStreak = Math.max(...streaks.map(s => s.longestStreak), 0);
    const totalActivities = streaks.reduce((sum, s) => sum + s.totalActivities, 0);
    
    // Get combined streak (any activity counts)
    const combinedStreak = await getCombinedStreak(userId);
    
    return c.json({
      streaks: streaks.map(s => ({
        id: s.id,
        streakType: s.streakType,
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
        lastActivityDate: s.lastActivityDate?.toISOString(),
        totalActivities: s.totalActivities,
        nextMilestone: getNextMilestone(s.currentStreak),
        progressToNextMilestone: getProgressToMilestone(s.currentStreak),
      })),
      combinedStreak,
      totalScore,
      bestStreak,
      totalActivities,
    });
  } catch (error) {
    console.error('Error fetching streaks:', error);
    return c.json({ error: 'Failed to fetch streaks' }, 500);
  }
});

// POST /api/streaks/track - Track an activity
streakRoutes.post('/track', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const body = await c.req.json();
    const { type } = body; // login, message, pin, event, mingle
    
    const streakType = type === 'message' ? 'social' : 
                       type === 'pin' ? 'explorer' : 
                       type === 'mingle' ? 'event' : type;
    
    if (!STREAK_TYPES.includes(streakType)) {
      return c.json({ error: 'Invalid activity type' }, 400);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = await prisma.userStreak.findUnique({
      where: { userId_streakType: { userId, streakType } },
    });
    
    let newStreak = 1;
    let hitMilestone = false;
    let milestoneValue = 0;
    
    if (!streak) {
      streak = await prisma.userStreak.create({
        data: { userId, streakType, currentStreak: 1, totalActivities: 1, lastActivityDate: today },
      });
      newStreak = 1;
    } else {
      const lastActivity = streak.lastActivityDate;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      newStreak = streak.currentStreak;
      
      if (lastActivity) {
        const lastDate = new Date(lastActivity);
        lastDate.setHours(0, 0, 0, 0);
        
        if (lastDate.getTime() === yesterday.getTime()) {
          // Consecutive day - increment streak
          newStreak += 1;
        } else if (lastDate.getTime() === today.getTime()) {
          // Already tracked today - don't change streak
          newStreak = streak.currentStreak;
        } else {
          // Streak broken - reset to 1
          newStreak = 1;
        }
      }
      
      // Check for milestone
      if (MILESTONES.includes(newStreak) && newStreak > streak.currentStreak) {
        hitMilestone = true;
        milestoneValue = newStreak;
      }
      
      await prisma.userStreak.update({
        where: { id: streak.id },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, streak.longestStreak),
          lastActivityDate: today,
          totalActivities: { increment: 1 },
        },
      });
    }
    
    // Record daily activity
    await prisma.dailyActivity.upsert({
      where: { userId_activityType_activityDate: { userId, activityType: type, activityDate: today } },
      create: { userId, activityType: type, activityDate: today },
      update: { count: { increment: 1 } },
    });
    
    // Send milestone notification
    if (hitMilestone) {
      await // sendStreakMilestone(userId, milestoneValue);
    }
    
    return c.json({ 
      success: true,
      currentStreak: newStreak,
      hitMilestone,
      milestoneValue: hitMilestone ? milestoneValue : null,
    });
  } catch (error) {
    console.error('Error tracking activity:', error);
    return c.json({ error: 'Failed to track activity' }, 500);
  }
});

// GET /api/streaks/history - Get activity history
streakRoutes.get('/history', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);
    
    const days = parseInt(c.req.query('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    const activities = await prisma.dailyActivity.findMany({
      where: {
        userId,
        activityDate: { gte: startDate },
      },
      orderBy: { activityDate: 'asc' },
    });
    
    // Group by date
    const byDate: Record<string, { date: string; activities: Record<string, number>; total: number }> = {};
    
    for (const activity of activities) {
      const dateStr = activity.activityDate.toISOString().split('T')[0];
      if (!byDate[dateStr]) {
        byDate[dateStr] = { date: dateStr, activities: {}, total: 0 };
      }
      byDate[dateStr].activities[activity.activityType] = activity.count;
      byDate[dateStr].total += activity.count;
    }
    
    return c.json({
      history: Object.values(byDate),
      totalDays: Object.keys(byDate).length,
      totalActivities: activities.reduce((sum, a) => sum + a.count, 0),
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return c.json({ error: 'Failed to fetch history' }, 500);
  }
});

// GET /api/streaks/leaderboard - Get streak leaderboard
streakRoutes.get('/leaderboard', async (c) => {
  try {
    const type = c.req.query('type') || 'combined';
    const limit = parseInt(c.req.query('limit') || '20');
    
    if (type === 'combined') {
      // Get users with highest total streaks
      const users = await prisma.user.findMany({
        where: {
          profile: { visibilityMode: { not: 'hidden' } },
        },
        include: {
          profile: true,
          streaks: true,
        },
        take: 100,
      });
      
      const ranked = users
        .map(user => ({
          id: user.id,
          displayName: user.profile?.displayName || user.name || 'Anonymous',
          avatar: user.profile?.avatar || user.image,
          totalStreak: user.streaks.reduce((sum, s) => sum + s.currentStreak, 0),
          bestStreak: Math.max(...user.streaks.map(s => s.longestStreak), 0),
        }))
        .filter(u => u.totalStreak > 0)
        .sort((a, b) => b.totalStreak - a.totalStreak)
        .slice(0, limit)
        .map((user, index) => ({ ...user, rank: index + 1 }));
      
      return c.json({ leaderboard: ranked });
    } else if (STREAK_TYPES.includes(type)) {
      // Get users with highest streak of specific type
      const streaks = await prisma.userStreak.findMany({
        where: { streakType: type, currentStreak: { gt: 0 } },
        orderBy: { currentStreak: 'desc' },
        take: limit,
        include: {
          user: {
            include: { profile: true },
          },
        },
      });
      
      const ranked = streaks.map((streak, index) => ({
        rank: index + 1,
        id: streak.user.id,
        displayName: streak.user.profile?.displayName || streak.user.name || 'Anonymous',
        avatar: streak.user.profile?.avatar || streak.user.image,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
      }));
      
      return c.json({ leaderboard: ranked });
    }
    
    return c.json({ error: 'Invalid type' }, 400);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return c.json({ error: 'Failed to fetch leaderboard' }, 500);
  }
});

// Helper functions
async function getCombinedStreak(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let checkDate = new Date(today);
  
  while (true) {
    const activities = await prisma.dailyActivity.findMany({
      where: {
        userId,
        activityDate: checkDate,
      },
    });
    
    if (activities.length === 0) {
      break;
    }
    
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
    
    // Limit check to prevent infinite loops
    if (streak > 365) break;
  }
  
  return streak;
}

function getNextMilestone(current: number): number {
  for (const milestone of MILESTONES) {
    if (milestone > current) return milestone;
  }
  return current + 100; // After 365, next is +100
}

function getProgressToMilestone(current: number): number {
  const next = getNextMilestone(current);
  const prev = MILESTONES.filter(m => m < next).pop() || 0;
  return Math.round(((current - prev) / (next - prev)) * 100);
}
