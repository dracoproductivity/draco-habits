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
    
    // Check weekdays
    if (habit.weekDays && habit.weekDays.length > 0) {
      const dayOfWeek = getDay(day);
      if (!habit.weekDays.includes(dayOfWeek)) {
        isScheduled = false;
      }
    }
    
    // Check week frequency (every X weeks)
    if (isScheduled && habit.repeatFrequency && habit.repeatFrequency > 1) {
      if (!isDateInWeekFrequency(day, habitCreatedAt, habit.repeatFrequency)) {
        isScheduled = false;
      }
    }
    
    // Check specific weeks of month
    if (isScheduled && habit.monthWeeks && habit.monthWeeks.length > 0) {
      const weekOfMonth = getWeekOfMonth(day);
      if (!habit.monthWeeks.includes(weekOfMonth)) {
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
  if (date < habitCreatedAt) return false;
  
  // Check if date is within the goal's period
  if (linkedGoal) {
    const boundaries = getPeriodBoundaries(linkedGoal.type, linkedGoal.period);
    if (!boundaries) return false;
    if (!isWithinInterval(date, { start: boundaries.start, end: boundaries.end })) {
      return false;
    }
  }
  
  // Handle one-time habits
  if (habit.isOneTime) {
    return format(date, 'yyyy-MM-dd') === format(habitCreatedAt, 'yyyy-MM-dd');
  }
  
  // Check weekdays
  if (habit.weekDays && habit.weekDays.length > 0) {
    const dayOfWeek = getDay(date);
    if (!habit.weekDays.includes(dayOfWeek)) return false;
  }
  
  // Check week frequency
  if (habit.repeatFrequency && habit.repeatFrequency > 1) {
    if (!isDateInWeekFrequency(date, habitCreatedAt, habit.repeatFrequency)) {
      return false;
    }
  }
  
  // Check specific weeks of month
  if (habit.monthWeeks && habit.monthWeeks.length > 0) {
    const weekOfMonth = getWeekOfMonth(date);
    if (!habit.monthWeeks.includes(weekOfMonth)) return false;
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

// Calculate goal progress based on its linked habits
export const calculateGoalProgress = (
  goal: Goal,
  habits: Habit[],
  habitChecks: HabitCheck[]
): number => {
  const linkedHabits = habits.filter(h => h.goalId === goal.id);
  
  if (linkedHabits.length === 0) return 0;
  
  let totalCompleted = 0;
  let totalOccurrences = 0;
  
  for (const habit of linkedHabits) {
    const progress = calculateHabitProgress(habit, goal, habitChecks);
    totalCompleted += progress.completed;
    totalOccurrences += progress.total;
  }
  
  if (totalOccurrences === 0) return 0;
  
  return Math.round((totalCompleted / totalOccurrences) * 100);
};

// Get all habits that should appear on a specific date
export const getHabitsForDate = (
  date: Date,
  habits: Habit[],
  goals: Goal[]
): Habit[] => {
  return habits.filter(habit => {
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
}

// Get the period identifier for a date
export const getPeriodIdentifier = (date: Date, type: GoalType): string => {
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  switch (type) {
    case 'yearly':
      return date.getFullYear().toString();
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

// Calculate progress for all periods (including phantom goals)
export const calculateAllPeriodProgress = (
  habits: Habit[],
  goals: Goal[],
  habitChecks: HabitCheck[]
): Map<string, PeriodProgress> => {
  const periodProgressMap = new Map<string, PeriodProgress>();
  const now = new Date();
  
  // First, process all explicit goals
  for (const goal of goals) {
    const progress = calculateGoalProgress(goal, habits, habitChecks);
    const boundaries = getPeriodBoundaries(goal.type, goal.period);
    const hasStarted = boundaries ? now >= boundaries.start : false;
    
    periodProgressMap.set(`${goal.type}-${goal.period}`, {
      type: goal.type,
      period: goal.period,
      progress,
      isPhantom: false,
      hasStarted
    });
  }
  
  // Then, calculate phantom progress for periods without explicit goals
  // This cascades from habits up through the hierarchy
  for (const habit of habits) {
    const linkedGoal = habit.goalId ? goals.find(g => g.id === habit.goalId) : null;
    const habitProgress = calculateHabitProgress(habit, linkedGoal, habitChecks);
    
    if (habitProgress.total === 0) continue;
    
    // Get the period for this habit's goal (or current period if no goal)
    const instances = calculateHabitInstances(habit, linkedGoal);
    
    for (const instance of instances) {
      const instDate = parseISO(instance.date);
      const isCompleted = habitChecks.some(
        hc => hc.habitId === habit.id && hc.date === instance.date && hc.completed
      );
      
      // Update phantom progress for all period types
      const periodTypes: GoalType[] = ['weekly', 'monthly', 'quarterly', 'yearly'];
      
      for (const pType of periodTypes) {
        const periodId = getPeriodIdentifier(instDate, pType);
        const key = `${pType}-${periodId}`;
        
        if (!periodProgressMap.has(key)) {
          const boundaries = getPeriodBoundaries(pType, periodId);
          const hasStarted = boundaries ? now >= boundaries.start : false;
          
          periodProgressMap.set(key, {
            type: pType,
            period: periodId,
            progress: 0,
            isPhantom: true,
            hasStarted
          });
        }
        
        // Accumulate progress (we'll normalize at the end)
        const current = periodProgressMap.get(key)!;
        // Mark if any check was made in this period
        if (isCompleted && !current.hasStarted) {
          current.hasStarted = true;
        }
      }
    }
  }
  
  // Recalculate phantom goal progress
  for (const [key, periodData] of periodProgressMap.entries()) {
    if (periodData.isPhantom) {
      // Calculate progress based on all habits that fall within this period
      let totalCompleted = 0;
      let totalOccurrences = 0;
      
      const boundaries = getPeriodBoundaries(periodData.type, periodData.period);
      if (!boundaries) continue;
      
      for (const habit of habits) {
        const linkedGoal = habit.goalId ? goals.find(g => g.id === habit.goalId) : null;
        const instances = calculateHabitInstances(habit, linkedGoal);
        
        for (const instance of instances) {
          const instDate = parseISO(instance.date);
          
          if (isWithinInterval(instDate, { start: boundaries.start, end: boundaries.end })) {
            totalOccurrences++;
            const isCompleted = habitChecks.some(
              hc => hc.habitId === habit.id && hc.date === instance.date && hc.completed
            );
            if (isCompleted) totalCompleted++;
          }
        }
      }
      
      periodData.progress = totalOccurrences > 0 
        ? Math.round((totalCompleted / totalOccurrences) * 100) 
        : 0;
    }
  }
  
  return periodProgressMap;
};

// Calculate hierarchical progress (year from quarters, quarters from months, etc.)
export const calculateHierarchicalProgress = (
  periodProgressMap: Map<string, PeriodProgress>,
  type: GoalType,
  period: string
): number => {
  const childTypes: Record<GoalType, GoalType | null> = {
    yearly: 'quarterly',
    quarterly: 'monthly',
    monthly: 'weekly',
    weekly: null
  };
  
  const childType = childTypes[type];
  if (!childType) {
    // Weekly - get direct progress
    return periodProgressMap.get(`${type}-${period}`)?.progress || 0;
  }
  
  // Get boundaries for this period
  const boundaries = getPeriodBoundaries(type, period);
  if (!boundaries) return 0;
  
  // Find all child periods within this period
  const childProgresses: number[] = [];
  
  for (const [key, data] of periodProgressMap.entries()) {
    if (data.type === childType) {
      const childBoundaries = getPeriodBoundaries(data.type, data.period);
      if (childBoundaries && 
          childBoundaries.start >= boundaries.start && 
          childBoundaries.end <= boundaries.end) {
        childProgresses.push(data.progress);
      }
    }
  }
  
  if (childProgresses.length === 0) return 0;
  
  // Average of child progresses
  return Math.round(childProgresses.reduce((a, b) => a + b, 0) / childProgresses.length);
};
