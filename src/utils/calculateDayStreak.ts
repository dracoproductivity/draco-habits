import { subDays, format } from 'date-fns';
import type { Habit, HabitCheck, Goal } from '@/types';
import { getHabitsForDate } from './habitInstanceCalculator';

/**
 * Calculates the current day streak.
 * Day streak = consecutive days where the user achieved 100% of non-vacation habits.
 * Habits with vacationMode are excluded from counting.
 * Habits with dracoSaveUsed count as completed.
 * 
 * @returns The current day streak count
 */
export const calculateDayStreak = (
    habits: Habit[],
    habitChecks: HabitCheck[],
    goals: Goal[]
): number => {
    if (!habits || !Array.isArray(habits) || !habitChecks || !Array.isArray(habitChecks)) return 0;
    const today = new Date();
    let streak = 0;

    // Check today first
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayComplete = isDayComplete(todayStr, today, habits, habitChecks, goals);

    if (todayComplete) {
        streak = 1;
    }

    // Go backwards from yesterday
    let currentDate = subDays(today, 1);
    const maxLookback = 365; // Don't look back more than a year

    for (let i = 0; i < maxLookback; i++) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const complete = isDayComplete(dateStr, currentDate, habits, habitChecks, goals);

        if (complete) {
            streak++;
        } else {
            // Check if there were any habits scheduled. If none, skip the day.
            const scheduled = getHabitsForDate(currentDate, habits, goals)
                .filter(h => !h.vacationMode);
            if (scheduled.length === 0) {
                // No habits scheduled — skip this day, doesn't break streak
                currentDate = subDays(currentDate, 1);
                continue;
            }
            break; // Missed a day with scheduled habits
        }
        currentDate = subDays(currentDate, 1);
    }

    return streak;
};

function isDayComplete(
    dateStr: string,
    dateObj: Date,
    habits: Habit[],
    habitChecks: HabitCheck[],
    goals: Goal[]
): boolean {
    const scheduled = getHabitsForDate(dateObj, habits, goals)
        .filter(h => !h.vacationMode);

    if (scheduled.length === 0) return false;

    for (const habit of scheduled) {
        const check = habitChecks.find(
            hc => hc.habitId === habit.id && hc.date === dateStr
        );

        // Draco Save counts as completed
        if (check?.dracoSaveUsed) continue;

        if (habit.hasMicroGoals && habit.microGoalsCount && habit.microGoalsCount > 1) {
            const microCompleted = check?.microGoalsCompleted || 0;
            if (microCompleted < habit.microGoalsCount) return false;
        } else {
            if (!check?.completed) return false;
        }
    }

    return true;
}
