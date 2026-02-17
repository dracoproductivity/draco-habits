import { Habit, Goal } from '@/types';

// XP limits for active (non-archived) recurring habits
export const XP_LIMITS: Record<number, number> = {
  50: 2,  // Muito difícil = 2
  40: 4,  // Difícil = 4
  30: 6,  // Médio = 6
  20: 8,  // Fácil = 8
  10: 10, // Muito fácil = 10
};

export const MAX_ACTIVE_HABITS = 30;
export const MAX_GOALS_PER_YEAR = 100;

/**
 * Check if a habit is currently active (recurring and not archived)
 */
export const isHabitActive = (habit: Habit): boolean => {
  if (habit.archived) return false;
  
  const today = new Date();
  
  // One-time habits are considered active if they were created recently (within 30 days)
  if (habit.isOneTime) {
    const createdDate = new Date(habit.createdAt);
    const daysDiff = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 30;
  }
  
  // If habit has an end date in the past, it's no longer active/recurring
  if (habit.endDate) {
    const endDate = new Date(habit.endDate);
    if (endDate < today) return false;
  }
  
  // Regular repeating habits are always considered active
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

/**
 * Count goals for a specific year
 */
export const getGoalsCountForYear = (goals: Goal[], year: number): number => {
  return goals.filter(g => {
    if (g.archived) return false;
    // Check if the goal's period contains the year
    return g.period?.includes(year.toString()) || false;
  }).length;
};

/**
 * Check if user can create a new goal for the given year
 */
export const canCreateGoalForYear = (goals: Goal[], year: number): boolean => {
  return getGoalsCountForYear(goals, year) < MAX_GOALS_PER_YEAR;
};
