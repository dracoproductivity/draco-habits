import { Habit, Goal } from '@/types';

// XP limits for active habits
export const XP_LIMITS: Record<number, number> = {
  50: 1, // Only 1 habit with 50XP
  40: 1, // Only 1 habit with 40XP
  30: 2, // Only 2 habits with 30XP
  20: 3, // Only 3 habits with 20XP
  10: 3, // Only 3 habits with 10XP
};

export const MAX_ACTIVE_HABITS = 10;
export const MAX_GOALS = 50;

/**
 * Check if a habit is currently active (has scheduled instances for today or future dates)
 */
export const isHabitActive = (habit: Habit): boolean => {
  const today = new Date();
  
  // One-time habits are considered active if they were created recently (within 30 days)
  if (habit.isOneTime) {
    const createdDate = new Date(habit.createdAt);
    const daysDiff = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 30;
  }
  
  // Regular repeating habits are always considered active
  // (they repeat on their scheduled days indefinitely)
  if (habit.weekDays && habit.weekDays.length > 0) {
    return true;
  }
  
  // Default: consider active
  return true;
};

/**
 * Get count of active habits by XP value
 */
export const getActiveHabitCountsByXP = (habits: Habit[]): Record<number, number> => {
  const counts: Record<number, number> = {
    50: 0,
    40: 0,
    30: 0,
    20: 0,
    10: 0,
    0: 0,
  };
  
  habits.forEach(habit => {
    if (isHabitActive(habit)) {
      const xp = habit.xpReward || 0;
      if (xp in counts) {
        counts[xp]++;
      }
    }
  });
  
  return counts;
};

/**
 * Get total count of active habits
 */
export const getTotalActiveHabits = (habits: Habit[]): number => {
  return habits.filter(isHabitActive).length;
};

/**
 * Check if XP value is available (not at limit)
 */
export const isXPAvailable = (xp: number, habits: Habit[]): boolean => {
  if (xp === 0) return true; // No limit for 0 XP
  
  const limit = XP_LIMITS[xp];
  if (limit === undefined) return true;
  
  const counts = getActiveHabitCountsByXP(habits);
  return counts[xp] < limit;
};

/**
 * Check if user can create a new habit
 */
export const canCreateHabit = (habits: Habit[]): boolean => {
  return getTotalActiveHabits(habits) < MAX_ACTIVE_HABITS;
};

/**
 * Get remaining slots for each XP value
 */
export const getRemainingSlots = (habits: Habit[]): Record<number, number> => {
  const counts = getActiveHabitCountsByXP(habits);
  
  return {
    50: Math.max(0, XP_LIMITS[50] - counts[50]),
    40: Math.max(0, XP_LIMITS[40] - counts[40]),
    30: Math.max(0, XP_LIMITS[30] - counts[30]),
    20: Math.max(0, XP_LIMITS[20] - counts[20]),
    10: Math.max(0, XP_LIMITS[10] - counts[10]),
    0: Infinity, // No limit for 0 XP
  };
};
