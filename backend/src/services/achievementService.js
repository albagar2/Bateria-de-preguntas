// ============================================
// Achievement Service — Gamification Logic
// ============================================
const { prisma } = require('../config/database');

const ACHIEVEMENTS = [
  { code: 'FIRST_TEST', name: 'Primer Paso', description: 'Completa tu primer test', icon: '🎯', type: 'VOLUME', threshold: 1 },
  { code: 'PERFECT_TEST', name: 'Perfeccionista', description: 'Saca un 10 en un test de al menos 10 preguntas', icon: '💎', type: 'ACCURACY', threshold: 100 },
  { code: 'STREAK_3', name: 'Constancia', description: 'Mantén una racha de 3 días', icon: '🔥', type: 'STREAK', threshold: 3 },
  { code: 'STREAK_7', name: 'Imparable', description: 'Mantén una racha de 7 días', icon: '⚡', type: 'STREAK', threshold: 7 },
  { code: 'FAST_RESPONDER', name: 'Relámpago', description: 'Responde una pregunta correctamente en menos de 2 segundos', icon: '🏃', type: 'SPEED', threshold: 2000 },
  { code: 'NIGHT_OWL', name: 'Búho Nocturno', description: 'Estudia después de las 12 de la noche', icon: '🦉', type: 'VOLUME', threshold: 0 },
];

/**
 * Seed achievements if they don't exist
 */
async function seedAchievements() {
  for (const ach of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: {
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        type: ach.type,
        threshold: ach.threshold
      },
      create: ach
    });
  }
}

/**
 * Check and award achievements for a user
 */
async function checkAchievements(userId, context = {}) {
  const { type: contextType, data } = context;
  const newAwards = [];

  // Get all achievements to have their IDs
  const allAchievements = await prisma.achievement.findMany({ where: { isActive: true } });
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievement: { select: { code: true } } }
  });
  
  const earnedCodes = new Set(userAchievements.map(ua => ua.achievement.code));

  const award = async (code) => {
    if (earnedCodes.has(code)) return;
    const ach = allAchievements.find(a => a.code === code);
    if (!ach) return;

    try {
      await prisma.userAchievement.create({
        data: { userId, achievementId: ach.id }
      });
      newAwards.push(ach);
      console.log(`[Achievement] Usuario ${userId} ganó: ${ach.name}`);
    } catch (e) {
      console.error('[Achievement Reward Error]:', e);
    }
  };

  // ─── LOGIC ────────────────────────────────

  if (contextType === 'TEST_COMPLETE') {
    await award('FIRST_TEST');
    if (data.score >= data.totalQuestions && data.totalQuestions >= 10) {
      await award('PERFECT_TEST');
    }
  }

  if (contextType === 'ANSWER_QUESTION') {
    if (data.isCorrect && data.responseTime < 2000) {
      await award('FAST_RESPONDER');
    }
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) {
      await award('NIGHT_OWL');
    }
  }

  if (contextType === 'STREAK_CHECK') {
    if (data.currentStreak >= 3) await award('STREAK_3');
    if (data.currentStreak >= 7) await award('STREAK_7');
  }

  return newAwards;
}

/**
 * Get user achievements
 */
async function getUserAchievements(userId) {
  return prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
    orderBy: { unlockedAt: 'desc' }
  });
}

module.exports = {
  seedAchievements,
  checkAchievements,
  getUserAchievements,
};
