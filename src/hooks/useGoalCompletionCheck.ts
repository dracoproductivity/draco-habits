import { useMemo } from 'react';
import { Goal, Habit, HabitCheck } from '@/types';
import { getPeriodBoundaries, isHabitScheduledForDate } from '@/utils/habitInstanceCalculator';
import { format, isSameDay, isAfter, isBefore, startOfDay } from 'date-fns';

interface UseGoalCompletionCheckProps {
  goals: Goal[];
  habits: Habit[];
  habitChecks: HabitCheck[];
  currentDate: Date;
}

interface GoalCompletionInfo {
  goalId: string;
  isLastDay: boolean;
  needsCompletion: boolean;
}

/**
 * Hook to check if today is the last day of any goal's period
 * and if all habits for that goal have been completed
 */
export const useGoalCompletionCheck = ({
  goals,
  habits,
  habitChecks,
  currentDate,
}: UseGoalCompletionCheckProps): GoalCompletionInfo[] => {
  return useMemo(() => {
    const today = startOfDay(currentDate);
    const todayStr = format(today, 'yyyy-MM-dd');
    const results: GoalCompletionInfo[] = [];

    for (const goal of goals) {
      // Skip if already has completion status
      if (goal.completionStatus) continue;

      // Get the period boundaries for this goal
      const boundaries = getPeriodBoundaries(goal.type, goal.period);
      if (!boundaries) continue;

      const periodEnd = startOfDay(boundaries.end);
      const isLastDay = isSameDay(today, periodEnd);

      if (!isLastDay) continue;

      // Get all habits linked to this goal
      const linkedHabits = habits.filter(h => h.goalId === goal.id);
      if (linkedHabits.length === 0) continue;

      // Check if all habits scheduled for today are completed
      let allHabitsCompleted = true;
      let hasScheduledHabits = false;

      for (const habit of linkedHabits) {
        // Check if habit is scheduled for today based on its own date range
        const habitStart = habit.startDate ? startOfDay(new Date(habit.startDate)) : boundaries.start;
        const habitEnd = habit.endDate ? startOfDay(new Date(habit.endDate)) : boundaries.end;

        // If today is outside habit's date range, skip
        if (isBefore(today, habitStart) || isAfter(today, habitEnd)) continue;

        // Check if habit is scheduled for this day of week
        if (!isHabitScheduledForDate(habit, today, goal)) continue;

        hasScheduledHabits = true;

        // Check if habit is completed today
        const check = habitChecks.find(
          hc => hc.habitId === habit.id && hc.date === todayStr
        );
        
        if (!check?.completed) {
          allHabitsCompleted = false;
          break;
        }
      }

      // If it's the last day and there are scheduled habits, add to results
      if (hasScheduledHabits) {
        results.push({
          goalId: goal.id,
          isLastDay: true,
          needsCompletion: allHabitsCompleted,
        });
      }
    }

    return results;
  }, [goals, habits, habitChecks, currentDate]);
};

/**
 * Check if completing a specific habit would trigger the goal completion modal
 * This is called when the user is about to complete a habit
 */
export const checkIfLastHabitForGoal = (
  habitId: string,
  date: string,
  goals: Goal[],
  habits: Habit[],
  habitChecks: HabitCheck[]
): Goal | null => {
  const habit = habits.find(h => h.id === habitId);
  if (!habit?.goalId) return null;

  const goal = goals.find(g => g.id === habit.goalId);
  if (!goal || goal.completionStatus) return null;

  // Check if today is the last day of the goal's period
  const boundaries = getPeriodBoundaries(goal.type, goal.period);
  if (!boundaries) return null;

  const today = startOfDay(new Date(date));
  const periodEnd = startOfDay(boundaries.end);
  
  if (!isSameDay(today, periodEnd)) return null;

  // Get all habits linked to this goal that are scheduled for today
  const linkedHabits = habits.filter(h => h.goalId === goal.id);
  
  for (const linkedHabit of linkedHabits) {
    // Check if habit is scheduled for this day
    const habitStart = linkedHabit.startDate ? startOfDay(new Date(linkedHabit.startDate)) : boundaries.start;
    const habitEnd = linkedHabit.endDate ? startOfDay(new Date(linkedHabit.endDate)) : boundaries.end;

    if (isBefore(today, habitStart) || isAfter(today, habitEnd)) continue;
    if (!isHabitScheduledForDate(linkedHabit, today, goal)) continue;

    // If this is the habit being completed, skip
    if (linkedHabit.id === habitId) continue;

    // Check if this habit is already completed
    const check = habitChecks.find(
      hc => hc.habitId === linkedHabit.id && hc.date === date
    );
    
    if (!check?.completed) {
      // There's still an uncompleted habit, so this is not the last one
      return null;
    }
  }

  // All other habits are completed, completing this one would finish the goal
  return goal;
};
