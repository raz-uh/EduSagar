/**
 * Rewards and Points Service
 * Handles weekly/monthly rewards, streak tracking, and badge earning
 * 
 * Features:
 * - Weekly points reset and bonus rewards
 * - Monthly challenges and rewards
 * - Streak tracking and bonus multipliers
 * - Badge earning logic
 * - Leaderboard calculations
 */

import { UserProfile, Badge } from '../types';
import { supabase } from './supabaseService';

// ============================================================
// REWARD CONFIGURATION
// ============================================================

export const REWARD_CONFIG = {
  // Base points for activities
  LESSON_COMPLETE: 10,           // Points for completing a lesson
  QUIZ_CORRECT: 5,               // Points per correct quiz answer
  MODULE_COMPLETE: 50,           // Bonus for completing a module
  COURSE_COMPLETE: 200,          // Bonus for completing entire course
  FLASHCARD_REVIEW: 2,           // Points for SRS review
  
  // Weekly rewards
  WEEKLY_THRESHOLD: 100,         // Points needed for weekly bonus
  WEEKLY_BONUS: 50,              // Bonus when threshold is met
  
  // Monthly challenges
  MONTHLY_THRESHOLD: 500,        // Points needed for monthly reward
  MONTHLY_BONUS: 300,            // Major bonus for monthly achievement
  
  // Streak multipliers
  STREAK_MILESTONE_3: 1.1,       // 10% bonus at 3-day streak
  STREAK_MILESTONE_7: 1.25,      // 25% bonus at 7-day streak
  STREAK_MILESTONE_30: 1.5,      // 50% bonus at 30-day streak
  
  // Badges
  BADGES: {
    EARLY_BIRD: { points: 0, icon: 'Zap', name: 'Early Bird' },
    SCHOLAR: { points: 500, icon: 'BookOpen', name: 'Syllabus Master' },
    CRYPTO_NATIVE: { points: 0, icon: 'ShieldCheck', name: 'Identity Verified' },
    TOP_LEARNER: { points: 1000, icon: 'Trophy', name: 'Grand Scholar' },
    STREAK_STAR: { points: 0, icon: 'Flame', name: 'Consistent Scholar' },
    WEEKLY_CHAMPION: { points: 500, icon: 'Medal', name: 'Weekly Champion' },
    MONTHLY_MASTER: { points: 2000, icon: 'Crown', name: 'Monthly Master' },
  }
};

// ============================================================
// CALCULATE STREAK MULTIPLIER
// ============================================================

export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return REWARD_CONFIG.STREAK_MILESTONE_30;
  if (streak >= 7) return REWARD_CONFIG.STREAK_MILESTONE_7;
  if (streak >= 3) return REWARD_CONFIG.STREAK_MILESTONE_3;
  return 1.0;
}

// ============================================================
// CALCULATE EARNED POINTS WITH MULTIPLIER
// ============================================================

export function calculateEarnedPoints(basePoints: number, streak: number): number {
  const multiplier = getStreakMultiplier(streak);
  return Math.floor(basePoints * multiplier);
}

// ============================================================
// UPDATE STREAK LOGIC
// ============================================================

export function updateStreak(user: UserProfile, lastActiveDate?: Date): { newStreak: number; streakBroken: boolean } {
  const now = new Date();
  const last = lastActiveDate || new Date(user.lastActiveDate || 0);
  
  // Calculate days difference
  const diffTime = Math.abs(now.getTime() - last.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // If user was active today, maintain streak
  if (diffDays === 0) {
    return { newStreak: user.streak, streakBroken: false };
  }
  
  // If user was active yesterday, increment streak
  if (diffDays === 1) {
    return { newStreak: user.streak + 1, streakBroken: false };
  }
  
  // If user was inactive for 2+ days, reset streak
  return { newStreak: 0, streakBroken: true };
}

// ============================================================
// WEEKLY REWARD LOGIC
// ============================================================

export interface WeeklyRewardResult {
  weeklyPointsEarned: number;
  weeklyBonusAwarded: boolean;
  newWeeklyPoints: number;
  message: string;
}

export function calculateWeeklyReward(user: UserProfile): WeeklyRewardResult {
  const currentWeeklyPoints = user.weeklyPoints;
  const isThresholdMet = currentWeeklyPoints >= REWARD_CONFIG.WEEKLY_THRESHOLD;
  
  const result: WeeklyRewardResult = {
    weeklyPointsEarned: currentWeeklyPoints,
    weeklyBonusAwarded: false,
    newWeeklyPoints: 0,
    message: ''
  };
  
  if (isThresholdMet) {
    result.weeklyBonusAwarded = true;
    result.newWeeklyPoints = REWARD_CONFIG.WEEKLY_BONUS;
    result.message = `🎉 Weekly Champion! Bonus ${REWARD_CONFIG.WEEKLY_BONUS} points awarded!`;
  } else {
    result.newWeeklyPoints = 0;
    const pointsNeeded = REWARD_CONFIG.WEEKLY_THRESHOLD - currentWeeklyPoints;
    result.message = `${pointsNeeded} more points needed for weekly bonus!`;
  }
  
  return result;
}

// ============================================================
// MONTHLY REWARD LOGIC
// ============================================================

export interface MonthlyRewardResult {
  monthlyPointsEarned: number;
  monthlyBonusAwarded: boolean;
  newMonthlyPoints: number;
  message: string;
  monthlyRank?: number;
}

export async function calculateMonthlyReward(user: UserProfile): Promise<MonthlyRewardResult> {
  try {
    // Query this month's total points from database
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Get current month's total points from Supabase
    const { data: userMonthData } = await supabase
      .from('users')
      .select('total_points, updated_at')
      .eq('id', user.id)
      .gte('updated_at', monthStart.toISOString())
      .lte('updated_at', monthEnd.toISOString())
      .single();
    
    const monthlyPoints = userMonthData?.total_points || 0;
    const isThresholdMet = monthlyPoints >= REWARD_CONFIG.MONTHLY_THRESHOLD;
    
    const result: MonthlyRewardResult = {
      monthlyPointsEarned: monthlyPoints,
      monthlyBonusAwarded: false,
      newMonthlyPoints: 0,
      message: ''
    };
    
    if (isThresholdMet) {
      result.monthlyBonusAwarded = true;
      result.newMonthlyPoints = REWARD_CONFIG.MONTHLY_BONUS;
      result.message = `🏆 Monthly Master! Bonus ${REWARD_CONFIG.MONTHLY_BONUS} points awarded!`;
    } else {
      result.newMonthlyPoints = 0;
      const pointsNeeded = REWARD_CONFIG.MONTHLY_THRESHOLD - monthlyPoints;
      result.message = `${pointsNeeded} more points needed for monthly master bonus!`;
    }
    
    return result;
  } catch (error) {
    console.error('Error calculating monthly reward:', error);
    return {
      monthlyPointsEarned: 0,
      monthlyBonusAwarded: false,
      newMonthlyPoints: 0,
      message: 'Unable to calculate monthly reward'
    };
  }
}

// ============================================================
// RESET WEEKLY POINTS (Called weekly via Supabase cron job)
// ============================================================

export async function resetWeeklyPoints(userId: string): Promise<void> {
  try {
    // Reset weekly_points to 0
    const { error } = await supabase
      .from('users')
      .update({ weekly_points: 0 })
      .eq('id', userId);
    
    if (error) throw error;
    console.log(`✅ Weekly points reset for user ${userId}`);
  } catch (error) {
    console.error('Error resetting weekly points:', error);
  }
}

// ============================================================
// AWARD WEEKLY BONUS (Called weekly via Supabase cron job)
// ============================================================

export async function awardWeeklyBonus(userId: string, currentUser: UserProfile): Promise<void> {
  try {
    const weeklyReward = calculateWeeklyReward(currentUser);
    
    if (weeklyReward.weeklyBonusAwarded) {
      // Add bonus to total points
      const newTotalPoints = currentUser.totalPoints + weeklyReward.newWeeklyPoints;
      
      const { error } = await supabase
        .from('users')
        .update({
          total_points: newTotalPoints,
          weekly_points: 0  // Reset after awarding
        })
        .eq('id', userId);
      
      if (error) throw error;
      console.log(`✅ Weekly bonus ${weeklyReward.newWeeklyPoints} awarded to ${userId}`);
    }
  } catch (error) {
    console.error('Error awarding weekly bonus:', error);
  }
}

// ============================================================
// AWARD MONTHLY BONUS (Called monthly via Supabase cron job)
// ============================================================

export async function awardMonthlyBonus(userId: string, currentUser: UserProfile): Promise<void> {
  try {
    const monthlyReward = await calculateMonthlyReward(currentUser);
    
    if (monthlyReward.monthlyBonusAwarded) {
      // Add bonus to total points
      const newTotalPoints = currentUser.totalPoints + monthlyReward.newMonthlyPoints;
      
      const { error } = await supabase
        .from('users')
        .update({
          total_points: newTotalPoints
        })
        .eq('id', userId);
      
      if (error) throw error;
      console.log(`✅ Monthly bonus ${monthlyReward.newMonthlyPoints} awarded to ${userId}`);
    }
  } catch (error) {
    console.error('Error awarding monthly bonus:', error);
  }
}

// ============================================================
// CHECK AND AWARD BADGES
// ============================================================

export async function checkAndAwardBadges(user: UserProfile): Promise<string[]> {
  const newBadgeIds: string[] = [];
  const existingBadgeIds = user.badges; // badges are already string[]
  
  // Check Early Bird (first session)
  if (!existingBadgeIds.includes('early_bird') && user.totalPoints >= 0) {
    newBadgeIds.push('early_bird');
  }
  
  // Check Scholar (500+ points)
  if (!existingBadgeIds.includes('scholar') && user.totalPoints >= 500) {
    newBadgeIds.push('scholar');
  }
  
  // Check Top Learner (1000+ points)
  if (!existingBadgeIds.includes('top_learner') && user.totalPoints >= 1000) {
    newBadgeIds.push('top_learner');
  }
  
  // Check Streak Star (5+ day streak)
  if (!existingBadgeIds.includes('streak_star') && user.streak >= 5) {
    newBadgeIds.push('streak_star');
  }
  
  // Check Weekly Champion
  if (!existingBadgeIds.includes('weekly_champion') && user.weeklyPoints >= REWARD_CONFIG.WEEKLY_THRESHOLD) {
    newBadgeIds.push('weekly_champion');
  }
  
  // Check Monthly Master
  if (!existingBadgeIds.includes('monthly_master')) {
    const monthlyReward = await calculateMonthlyReward(user);
    if (monthlyReward.monthlyBonusAwarded) {
      newBadgeIds.push('monthly_master');
    }
  }
  
  // Update user in database with new badges
  if (newBadgeIds.length > 0) {
    try {
      const allBadges = [...existingBadgeIds, ...newBadgeIds];
      await supabase
        .from('users')
        .update({ badges: allBadges })
        .eq('id', user.id);
      
      console.log(`✅ ${newBadgeIds.length} new badges awarded to ${user.id}`);
    } catch (error) {
      console.error('Error updating badges:', error);
    }
  }
  
  return newBadgeIds;
}

// ============================================================
// GET LEADERBOARD WITH REWARDS
// ============================================================

export async function getLeaderboard(limit: number = 100): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('leaderboard_view')
      .select('*')
      .limit(limit);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

// ============================================================
// GET WEEKLY PROGRESS PERCENTAGE
// ============================================================

export function getWeeklyProgress(user: UserProfile): number {
  const percentage = Math.min(
    (user.weeklyPoints / REWARD_CONFIG.WEEKLY_THRESHOLD) * 100,
    100
  );
  return Math.round(percentage);
}

// ============================================================
// GET MONTHLY PROGRESS PERCENTAGE
// ============================================================

export async function getMonthlyProgress(user: UserProfile): Promise<number> {
  try {
    const { data } = await supabase
      .from('users')
      .select('total_points, updated_at')
      .eq('id', user.id)
      .gte('updated_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .single();
    
    if (!data) return 0;
    
    const percentage = Math.min(
      (data.total_points / REWARD_CONFIG.MONTHLY_THRESHOLD) * 100,
      100
    );
    return Math.round(percentage);
  } catch (error) {
    console.error('Error calculating monthly progress:', error);
    return 0;
  }
}

// ============================================================
// GET NEXT REWARD MILESTONE
// ============================================================

export interface NextMilestone {
  type: 'weekly' | 'monthly';
  pointsNeeded: number;
  reward: number;
  daysLeft?: number;
  message: string;
}

export function getNextMilestone(user: UserProfile): NextMilestone {
  const weeklyNeeded = Math.max(0, REWARD_CONFIG.WEEKLY_THRESHOLD - user.weeklyPoints);
  
  if (weeklyNeeded > 0) {
    return {
      type: 'weekly',
      pointsNeeded: weeklyNeeded,
      reward: REWARD_CONFIG.WEEKLY_BONUS,
      daysLeft: 7,
      message: `${weeklyNeeded} points until weekly bonus!`
    };
  }
  
  return {
    type: 'monthly',
    pointsNeeded: REWARD_CONFIG.MONTHLY_THRESHOLD - user.totalPoints,
    reward: REWARD_CONFIG.MONTHLY_BONUS,
    message: `Aiming for monthly master! ${REWARD_CONFIG.MONTHLY_THRESHOLD - user.totalPoints} points needed.`
  };
}

// ============================================================
// EXPORT FOR USE IN APP
// ============================================================

export default {
  REWARD_CONFIG,
  getStreakMultiplier,
  calculateEarnedPoints,
  updateStreak,
  calculateWeeklyReward,
  calculateMonthlyReward,
  resetWeeklyPoints,
  awardWeeklyBonus,
  awardMonthlyBonus,
  checkAndAwardBadges,
  getLeaderboard,
  getWeeklyProgress,
  getMonthlyProgress,
  getNextMilestone,
};
