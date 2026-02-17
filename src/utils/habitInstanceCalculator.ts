import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear,
  eachDayOfInterval,
  getWeek,
  getDay,
  format,
  addWeeks,
  differenceInWeeks,
  isSameWeek,
  isWithinInterval,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Habit, Goal, GoalType, HabitCheck } from '@/types';

export interface HabitInstance {
  date: string; // YYYY-MM-DD
  habitId: string;
  isScheduled: boolean;
}

export interface HabitProgress {
  completed: number; // X
  total: number; // N
  percentage: number;
}

// Get the period boundaries for a goal
export const getPeriodBoundaries = (type: GoalType, period: string): { start: Date; end: Date } | null => {
  const now = new Date();
  
  switch (type) {
    case 'yearly': {
      const year = parseInt(period);
      if (isNaN(year)) return null;
      return {
        start: startOfYear(new Date(year, 0, 1)),
        end: endOfYear(new Date(year, 0, 1))
      };
    }
    case 'semestral': {
      // Format: "1º Sem - 2025" or "2º Sem - 2025"
      const match = period.match(/(\d+)º Sem - (\d+)/);
      if (!match) return null;
      const semester = parseInt(match[1]);
      const year = parseInt(match[2]);
      const semesterStart = semester === 1 
        ? new Date(year, 0, 1) // January 1st
        : new Date(year, 6, 1); // July 1st
      const semesterEnd = semester === 1
        ? new Date(year, 5, 30) // June 30th
        : new Date(year, 11, 31); // December 31st
      return {
        start: semesterStart,
        end: semesterEnd
      };
    }
    case 'quarterly': {
      // Format: "1º Tri - 2025"
      const match = period.match(/(\d+)º Tri - (\d+)/);
      if (!match) return null;
      const quarter = parseInt(match[1]);
      const year = parseInt(match[2]);
      const quarterStart = startOfQuarter(new Date(year, (quarter - 1) * 3, 1));
      return {
        start: quarterStart,
        end: endOfQuarter(quarterStart)
      };
    }
    case 'monthly': {
      // Format: "Janeiro 2025"
      const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const parts = period.split(' ');
      const monthIndex = months.indexOf(parts[0]);
      const year = parseInt(parts[1]);
      if (monthIndex === -1 || isNaN(year)) return null;
      const monthStart = startOfMonth(new Date(year, monthIndex, 1));
      return {
        start: monthStart,
        end: endOfMonth(monthStart)
      };
    }
    case 'weekly': {
      // Format: "Semana X - YYYY" or "Semana X - dates"
      const match = period.match(/Semana (\d+) - (\d{4})/);
      if (!match) return null;
      const weekNum = parseInt(match[1]);
      const year = parseInt(match[2]);
      const yearStart = startOfYear(new Date(year, 0, 1));
      const weekStart = startOfWeek(addWeeks(yearStart, weekNum - 1), { weekStartsOn: 1 });
      return {
        start: weekStart,
        end: endOfWeek(weekStart, { weekStartsOn: 1 })
      };
    }
  }
  return null;
};

// Get the week number within a month (1-5)
export const getWeekOfMonth = (date: Date): number => {
  const firstDayOfMonth = startOfMonth(date);
  const firstWeekStart = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
  
  // If first day of month is before the week start, adjust
  const dayOfFirst = getDay(firstDayOfMonth);
  const offset = dayOfFirst === 0 ? 6 : dayOfFirst - 1; // Monday = 0
  
  const dayOfMonth = date.getDate();
  return Math.ceil((dayOfMonth + offset) / 7);
};

// Check if a date should have the habit based on week frequency
export const isDateInWeekFrequency = (
  date: Date, 
  habitCreatedAt: Date, 
  repeatFrequency: number
): boolean => {
  if (repeatFrequency === 1) return true;
  
  const weeksSinceCreation = differenceInWeeks(
    startOfWeek(date, { weekStartsOn: 1 }), 
    startOfWeek(habitCreatedAt, { weekStartsOn: 1 })
  );
  
  return weeksSinceCreation % repeatFrequency === 0;
};

// Calculate all scheduled instance dates for a habit
export const calculateHabitInstances = (
  habit: Habit,
  linkedGoal: Goal | null,
  fromDate?: Date
): HabitInstance[] => {
  const instances: HabitInstance[] = [];
  const habitCreatedAt = parseISO(habit.createdAt);
  
  // Determine period boundaries
  let periodStart: Date;
  let periodEnd: Date;
  
  if (linkedGoal) {
    const boundaries = getPeriodBoundaries(linkedGoal.type, linkedGoal.period);
    if (!boundaries) return instances;
    periodStart = boundaries.start;
    periodEnd = boundaries.end;
  } else {
    // If no goal, use current year
    const now = new Date();
    periodStart = startOfYear(now);
    periodEnd = endOfYear(now);
  }
  
  // Apply habit's own start/end date constraints if defined
  if (habit.startDate) {
    const habitStart = parseISO(habit.startDate);
    if (habitStart > periodStart) {
      periodStart = habitStart;
    }
  }
  
  if (habit.endDate) {
    const habitEnd = parseISO(habit.endDate);
    if (habitEnd < periodEnd) {
      periodEnd = habitEnd;
    }
  }
  
  // Start from habit creation date or period start, whichever is later
  const effectiveStart = fromDate 
    ? (fromDate > habitCreatedAt ? fromDate : habitCreatedAt)
    : (habitCreatedAt > periodStart ? habitCreatedAt : periodStart);
  
  if (effectiveStart > periodEnd) return instances;
  
  // Handle one-time habits
  if (habit.isOneTime) {
    const dateStr = format(effectiveStart, 'yyyy-MM-dd');
    instances.push({ date: dateStr, habitId: habit.id, isScheduled: true });
    return instances;
  }
  
  // Get all days in the period
  const allDays = eachDayOfInterval({ start: effectiveStart, end: periodEnd });
  
  for (const day of allDays) {
    let isScheduled = true;
    
    // Determine which schedule to use based on scheduleUpdatedAt
    let weekDays = habit.weekDays;
    let repeatFrequency = habit.repeatFrequency;
    let monthWeeks = habit.monthWeeks;
    
    if (habit.scheduleUpdatedAt) {
      const scheduleUpdatedAt = parseISO(habit.scheduleUpdatedAt);
      const scheduleUpdatedDateOnly = new Date(
        scheduleUpdatedAt.getFullYear(), 
        scheduleUpdatedAt.getMonth(), 
        scheduleUpdatedAt.getDate()
      );
      const dayDateOnly = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      
      // If the date is before the schedule was updated, use previous schedule
      // Only use previous values if they actually exist (not undefined)
      if (dayDateOnly < scheduleUpdatedDateOnly) {
        if (habit.previousWeekDays !== undefined) {
          weekDays = habit.previousWeekDays;
        }
        if (habit.previousRepeatFrequency !== undefined) {
          repeatFrequency = habit.previousRepeatFrequency;
        }
        if (habit.previousMonthWeeks !== undefined) {
          monthWeeks = habit.previousMonthWeeks;
        }
      }
    }
    
    // Check weekdays
    if (weekDays && weekDays.length > 0) {
      const dayOfWeek = getDay(day);
      if (!weekDays.includes(dayOfWeek)) {
        isScheduled = false;
      }
    }
    
    // Check week frequency (every X weeks)
    if (isScheduled && repeatFrequency && repeatFrequency > 1) {
      if (!isDateInWeekFrequency(day, habitCreatedAt, repeatFrequency)) {
        isScheduled = false;
      }
    }
    
    // Check specific weeks of month
    if (isScheduled && monthWeeks && monthWeeks.length > 0) {
      const weekOfMonth = getWeekOfMonth(day);
      if (!monthWeeks.includes(weekOfMonth)) {
        isScheduled = false;
      }
    }
    
    if (isScheduled) {
      instances.push({
        date: format(day, 'yyyy-MM-dd'),
        habitId: habit.id,
        isScheduled: true
      });
    }
  }
  
  return instances;
};

// Calculate the total N (occurrences) for a habit
export const calculateTotalOccurrences = (
  habit: Habit,
  linkedGoal: Goal | null
): number => {
  const instances = calculateHabitInstances(habit, linkedGoal);
  return instances.length;
};

// Check if a habit should appear on a specific date
export const isHabitScheduledForDate = (
  habit: Habit,
  date: Date,
  linkedGoal: Goal | null
): boolean => {
  const habitCreatedAt = parseISO(habit.createdAt);
  
  // If date is before habit creation, it's not scheduled
  // Use date-only comparison to avoid timezone issues
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const createdDateOnly = new Date(habitCreatedAt.getFullYear(), habitCreatedAt.getMonth(), habitCreatedAt.getDate());
  if (dateOnly < createdDateOnly) return false;
  
  // Check habit's own start/end date constraints
  if (habit.startDate) {
    const startDateOnly = parseISO(habit.startDate);
    if (dateOnly < new Date(startDateOnly.getFullYear(), startDateOnly.getMonth(), startDateOnly.getDate())) {
      return false;
    }
  }
  
  if (habit.endDate) {
    const endDateOnly = parseISO(habit.endDate);
    if (dateOnly > new Date(endDateOnly.getFullYear(), endDateOnly.getMonth(), endDateOnly.getDate())) {
      return false;
    }
  }
  
  // Check if date is within the goal's period (only if goal exists)
  if (linkedGoal) {
    const boundaries = getPeriodBoundaries(linkedGoal.type, linkedGoal.period);
    if (boundaries) {
      if (!isWithinInterval(dateOnly, { start: boundaries.start, end: boundaries.end })) {
        return false;
      }
    }
  }
  // If no linked goal, the habit is valid for all dates after creation
  
  // Handle one-time habits
  if (habit.isOneTime) {
    return format(dateOnly, 'yyyy-MM-dd') === format(createdDateOnly, 'yyyy-MM-dd');
  }
  
  // Determine which schedule to use based on scheduleUpdatedAt
  // If the date is before the schedule was updated, use the previous schedule
  let weekDays = habit.weekDays;
  let repeatFrequency = habit.repeatFrequency;
  let monthWeeks = habit.monthWeeks;
  
  if (habit.scheduleUpdatedAt) {
    const scheduleUpdatedAt = parseISO(habit.scheduleUpdatedAt);
    const scheduleUpdatedDateOnly = new Date(
      scheduleUpdatedAt.getFullYear(), 
      scheduleUpdatedAt.getMonth(), 
      scheduleUpdatedAt.getDate()
    );
    
    // If the date is before the schedule was updated, use previous schedule
    // Only use previous values if they actually exist (not undefined)
    if (dateOnly < scheduleUpdatedDateOnly) {
      if (habit.previousWeekDays !== undefined) {
        weekDays = habit.previousWeekDays;
      }
      if (habit.previousRepeatFrequency !== undefined) {
        repeatFrequency = habit.previousRepeatFrequency;
      }
      if (habit.previousMonthWeeks !== undefined) {
        monthWeeks = habit.previousMonthWeeks;
      }
    }
  }
  
  // Check weekdays
  if (weekDays && weekDays.length > 0) {
    const dayOfWeek = getDay(dateOnly);
    if (!weekDays.includes(dayOfWeek)) return false;
  }
  
  // Check week frequency
  if (repeatFrequency && repeatFrequency > 1) {
    if (!isDateInWeekFrequency(dateOnly, habitCreatedAt, repeatFrequency)) {
      return false;
    }
  }
  
  // Check specific weeks of month
  if (monthWeeks && monthWeeks.length > 0) {
    const weekOfMonth = getWeekOfMonth(dateOnly);
    if (!monthWeeks.includes(weekOfMonth)) return false;
  }
  
  return true;
};

// Calculate habit progress (X/N)
export const calculateHabitProgress = (
  habit: Habit,
  linkedGoal: Goal | null,
  habitChecks: HabitCheck[]
): HabitProgress => {
  const instances = calculateHabitInstances(habit, linkedGoal);
  const total = instances.length;
  
  if (total === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }
  
  const completedDates = new Set(
    habitChecks
      .filter(hc => hc.habitId === habit.id && hc.completed)
      .map(hc => hc.date)
  );
  
  const completed = instances.filter(inst => completedDates.has(inst.date)).length;
  const percentage = Math.round((completed / total) * 100);
  
  return { completed, total, percentage };
};

// Calculate goal progress based on its linked habits (X/N method)
export const calculateGoalProgress = (
  goal: Goal,
  habits: Habit[],
  habitChecks: HabitCheck[]
): number => {
  const { completed, total } = calculateGoalXN(goal, habits, habitChecks);
  
  if (total === 0) return 0;
  
  return Math.round((completed / total) * 100);
};

// Calculate goal X/N (completed / total instances across all linked habits)
export const calculateGoalXN = (
  goal: Goal,
  habits: Habit[],
  habitChecks: HabitCheck[]
): { completed: number; total: number } => {
  const linkedHabits = habits.filter(h => h.goalId === goal.id);
  
  if (linkedHabits.length === 0) return { completed: 0, total: 0 };
  
  let totalCompleted = 0;
  let totalOccurrences = 0;
  
  for (const habit of linkedHabits) {
    const progress = calculateHabitProgress(habit, goal, habitChecks);
    totalCompleted += progress.completed;
    totalOccurrences += progress.total;
  }
  
  return { completed: totalCompleted, total: totalOccurrences };
};

// Get all habits that should appear on a specific date
export const getHabitsForDate = (
  date: Date,
  habits: Habit[],
  goals: Goal[]
): Habit[] => {
  return habits.filter(habit => {
    if (habit.archived) return false;
    const linkedGoal = habit.goalId ? goals.find(g => g.id === habit.goalId) : null;
    return isHabitScheduledForDate(habit, date, linkedGoal);
  });
};

// Calculate period progress (phantom goals)
export interface PeriodProgress {
  type: GoalType;
  period: string;
  progress: number;
  isPhantom: boolean; // true if no explicit goal exists
  hasStarted: boolean;
  completed: number; // X - total completed checks
  total: number; // N - total scheduled checks
}

// Get the period identifier for a date
export const getPeriodIdentifier = (date: Date, type: GoalType): string => {
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  switch (type) {
    case 'yearly':
      return date.getFullYear().toString();
    case 'semestral':
      const semester = date.getMonth() < 6 ? 1 : 2;
      return `${semester}º Sem - ${date.getFullYear()}`;
    case 'quarterly':
      const quarter = Math.ceil((date.getMonth() + 1) / 3);
      return `${quarter}º Tri - ${date.getFullYear()}`;
    case 'monthly':
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    case 'weekly':
      const weekNum = getWeek(date, { weekStartsOn: 1 });
      return `Semana ${weekNum} - ${date.getFullYear()}`;
  }
};

// Interface for X/N counts by period
export interface PeriodXN {
  completed: number; // X
  total: number; // N
}

/**
 * Calculate X (completed) and N (total) for a specific period
 * This counts ALL habit instances that fall within the period boundaries
 * regardless of what type of goal they're linked to
 */
export const calculatePeriodXN = (
  type: GoalType,
  period: string,
  habits: Habit[],
  goals: Goal[],
  habitChecks: HabitCheck[]
): PeriodXN => {
  const boundaries = getPeriodBoundaries(type, period);
  if (!boundaries) return { completed: 0, total: 0 };

  let totalCompleted = 0;
  let totalScheduled = 0;

  // Iterate through ALL habits and count instances within this period
  for (const habit of habits) {
    const linkedGoal = habit.goalId ? goals.find(g => g.id === habit.goalId) : null;
    
    // Get all instances for this habit
    const instances = calculateHabitInstances(habit, linkedGoal);
    
    for (const instance of instances) {
      const instDate = parseISO(instance.date);
      
      // Check if this instance falls within the period boundaries
      if (isWithinInterval(instDate, { start: boundaries.start, end: boundaries.end })) {
        totalScheduled++;
        
        const isCompleted = habitChecks.some(
          hc => hc.habitId === habit.id && hc.date === instance.date && hc.completed
        );
        
        if (isCompleted) {
          totalCompleted++;
        }
      }
    }
  }

  return { completed: totalCompleted, total: totalScheduled };
};

/**
 * Calculate hierarchical period progress using X/N method
 * For yearly: sum of ALL habit checks in the year / total habit instances in the year
 * For quarterly: sum of ALL habit checks in the quarter / total habit instances in the quarter
 * etc.
 */
export const calculateHierarchicalPeriodProgress = (
  type: GoalType,
  period: string,
  habits: Habit[],
  goals: Goal[],
  habitChecks: HabitCheck[]
): { progress: number; completed: number; total: number } => {
  const xn = calculatePeriodXN(type, period, habits, goals, habitChecks);
  const progress = xn.total > 0 ? Math.round((xn.completed / xn.total) * 100) : 0;
  
  return {
    progress,
    completed: xn.completed,
    total: xn.total
  };
};

// Calculate progress for all periods (including phantom goals)
export const calculateAllPeriodProgress = (
  habits: Habit[],
  goals: Goal[],
  habitChecks: HabitCheck[]
): Map<string, PeriodProgress> => {
  const periodProgressMap = new Map<string, PeriodProgress>();
  const now = new Date();
  
  // First, process all explicit goals using X/N method
  for (const goal of goals) {
    const { progress, completed, total } = calculateHierarchicalPeriodProgress(
      goal.type,
      goal.period,
      habits.filter(h => h.goalId === goal.id), // Only habits linked to this goal
      [goal],
      habitChecks
    );
    
    const boundaries = getPeriodBoundaries(goal.type, goal.period);
    const hasStarted = boundaries ? now >= boundaries.start : false;
    
    periodProgressMap.set(`${goal.type}-${goal.period}`, {
      type: goal.type,
      period: goal.period,
      progress,
      isPhantom: false,
      hasStarted,
      completed,
      total
    });
  }
  
  // Calculate phantom progress for periods without explicit goals
  // This uses X/N across ALL habits that fall within the period
  const allInstances: { date: Date; habitId: string; instanceDate: string }[] = [];
  
  for (const habit of habits) {
    const linkedGoal = habit.goalId ? goals.find(g => g.id === habit.goalId) : null;
    const instances = calculateHabitInstances(habit, linkedGoal);
    
    for (const instance of instances) {
      allInstances.push({
        date: parseISO(instance.date),
        habitId: habit.id,
        instanceDate: instance.date
      });
    }
  }
  
  // Group instances by period and calculate X/N for each
  const periodTypes: GoalType[] = ['weekly', 'monthly', 'quarterly', 'semestral', 'yearly'];
  
  for (const instance of allInstances) {
    for (const pType of periodTypes) {
      const periodId = getPeriodIdentifier(instance.date, pType);
      const key = `${pType}-${periodId}`;
      
      // Only create phantom periods (explicit goals are already handled)
      if (!periodProgressMap.has(key)) {
        const boundaries = getPeriodBoundaries(pType, periodId);
        const hasStarted = boundaries ? now >= boundaries.start : false;
        
        // Calculate X/N for this phantom period
        const xn = calculatePeriodXN(pType, periodId, habits, goals, habitChecks);
        const progress = xn.total > 0 ? Math.round((xn.completed / xn.total) * 100) : 0;
        
        periodProgressMap.set(key, {
          type: pType,
          period: periodId,
          progress,
          isPhantom: true,
          hasStarted,
          completed: xn.completed,
          total: xn.total
        });
      }
    }
  }
  
  return periodProgressMap;
};

// Calculate hierarchical progress using pure X/N (no averaging of percentages)
export const calculateHierarchicalProgress = (
  periodProgressMap: Map<string, PeriodProgress>,
  type: GoalType,
  period: string
): number => {
  // Simply return the direct X/N progress for this period
  const periodData = periodProgressMap.get(`${type}-${period}`);
  return periodData?.progress || 0;
};
