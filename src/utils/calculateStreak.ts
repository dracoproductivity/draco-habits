import { format, subDays } from 'date-fns';
import type { Habit, HabitCheck, Goal } from '@/types';
import { isHabitScheduledForDate } from './habitInstanceCalculator';

/**
 * Calculates the current streak for a habit.
 * Streak = consecutive days the habit was completed without missing a scheduled day.
 * If the user misses a scheduled day, the streak resets to 0.
 * 
 * @param habit - The habit to calculate the streak for
 * @param habitChecks - All habit checks
 * @param linkedGoal - The goal linked to this habit (if any)
 * @returns The current streak count
 */
export const calculateHabitStreak = (
  habit: Habit,
  habitChecks: HabitCheck[],
  linkedGoal: Goal | null
): number => {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const habitCreatedDate = new Date(habit.createdAt);
  
  // Filter checks for this habit only
  const thisHabitChecks = habitChecks.filter(hc => hc.habitId === habit.id);
  
  // Create a set of completed dates for quick lookup
  const completedDates = new Set(
    thisHabitChecks
      .filter(hc => hc.completed)
      .map(hc => hc.date)
  );
  
  let streak = 0;
  let currentDate = today;
  
  // Check if today is scheduled
  const isTodayScheduled = isHabitScheduledForDate(habit, today, linkedGoal);
  
  // If today is scheduled but not completed, start from yesterday
  // If today is scheduled and completed, include it in streak
  // If today is not scheduled, start from yesterday
  if (isTodayScheduled && completedDates.has(todayStr)) {
    streak = 1;
    currentDate = subDays(today, 1);
  } else if (isTodayScheduled && !completedDates.has(todayStr)) {
    // Today is scheduled but not done yet - count from yesterday
    currentDate = subDays(today, 1);
  } else {
    // Today is not scheduled - start counting from yesterday
    currentDate = subDays(today, 1);
  }
  
  // Go backwards day by day
  while (currentDate >= habitCreatedDate) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const isScheduled = isHabitScheduledForDate(habit, currentDate, linkedGoal);
    
    if (isScheduled) {
      if (completedDates.has(dateStr)) {
        streak++;
      } else {
        // Missed a scheduled day - streak ends
        break;
      }
    }
    // If not scheduled, just skip this day (doesn't break streak)
    
    currentDate = subDays(currentDate, 1);
  }
  
  return streak;
};
