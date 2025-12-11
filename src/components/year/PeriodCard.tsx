import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { GoalType, Goal } from '@/types';
import { cn } from '@/lib/utils';
import { 
  calculateGoalProgress, 
  getPeriodBoundaries,
  isHabitScheduledForDate
} from '@/utils/habitInstanceCalculator';
import { eachDayOfInterval, parseISO, isWithinInterval, getDay } from 'date-fns';

interface PeriodCardProps {
  title: string;
  subtitle?: string;
  type: GoalType;
  period: string;
  className?: string;
  onClick?: () => void;
  quarterMonths?: string[];
  displayYear?: number;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const getPeriodStatus = (type: GoalType, period: string, displayYear?: number): 'started' | 'not_started' | 'past' => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentQuarter = Math.ceil((currentMonth + 1) / 3);
  
  const yearToCheck = displayYear || currentYear;
  
  if (yearToCheck > currentYear) return 'not_started';
  if (yearToCheck < currentYear) return 'past';
  
  if (type === 'yearly') return 'started';
  
  if (type === 'quarterly') {
    const quarterMatch = period.match(/(\d+)º Tri/);
    if (quarterMatch) {
      const quarter = parseInt(quarterMatch[1]);
      if (quarter < currentQuarter) return 'past';
      if (quarter === currentQuarter) return 'started';
      return 'not_started';
    }
  }
  
  if (type === 'monthly') {
    const monthName = period.split(' ')[0];
    const monthIndex = MONTH_NAMES.indexOf(monthName);
    if (monthIndex !== -1) {
      if (monthIndex < currentMonth) return 'past';
      if (monthIndex === currentMonth) return 'started';
      return 'not_started';
    }
  }
  
  if (type === 'weekly') {
    const weekMatch = period.match(/Semana (\d+)/);
    const yearMatch = period.match(/(\d{4})/);
    if (weekMatch) {
      const week = parseInt(weekMatch[1]);
      const periodYear = yearMatch ? parseInt(yearMatch[1]) : currentYear;
      
      if (periodYear > currentYear) return 'not_started';
      if (periodYear < currentYear) return 'past';
      
      const currentWeek = Math.ceil(
        (now.getTime() - new Date(currentYear, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      if (week < currentWeek) return 'past';
      if (week === currentWeek) return 'started';
      return 'not_started';
    }
  }
  
  return 'started';
};

const ProgressCircle = ({ progress }: { progress: number }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg width="50" height="50" className="transform -rotate-90">
      <circle
        cx="25"
        cy="25"
        r={radius}
        stroke="hsl(var(--muted))"
        strokeWidth="4"
        fill="none"
      />
      <motion.circle
        cx="25"
        cy="25"
        r={radius}
        stroke="hsl(var(--primary))"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        style={{ strokeDasharray: circumference }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </svg>
  );
};

// Calculate period progress including all child periods and their habits
const calculatePeriodProgressWithChildren = (
  type: GoalType,
  period: string,
  goals: Goal[],
  habits: any[],
  habitChecks: any[],
  displayYear?: number
): number => {
  const boundaries = getPeriodBoundaries(type, period);
  if (!boundaries) return 0;

  let totalCompleted = 0;
  let totalOccurrences = 0;
  
  // Get all days in the period
  const allDays = eachDayOfInterval({ start: boundaries.start, end: boundaries.end });
  
  // For each day, find all habits that should be scheduled
  for (const day of allDays) {
    const dateStr = day.toISOString().split('T')[0];
    
    for (const habit of habits) {
      const linkedGoal = habit.goalId ? goals.find(g => g.id === habit.goalId) : null;
      
      // Check if this habit belongs to a period within the current boundaries
      if (linkedGoal) {
        const goalBoundaries = getPeriodBoundaries(linkedGoal.type, linkedGoal.period);
        if (!goalBoundaries) continue;
        
        // Goal period must be within or equal to this period's boundaries
        if (goalBoundaries.start < boundaries.start || goalBoundaries.end > boundaries.end) {
          continue;
        }
        
        // Check if habit is scheduled for this day
        const habitCreatedAt = parseISO(habit.createdAt);
        if (day < habitCreatedAt) continue;
        
        // Check if day is within the goal's boundaries
        if (!isWithinInterval(day, { start: goalBoundaries.start, end: goalBoundaries.end })) {
          continue;
        }
        
        // Check weekdays
        if (habit.weekDays && habit.weekDays.length > 0) {
          const dayOfWeek = getDay(day);
          if (!habit.weekDays.includes(dayOfWeek)) continue;
        }
        
        // Check one-time habits
        if (habit.isOneTime) {
          if (dateStr !== habitCreatedAt.toISOString().split('T')[0]) continue;
        }
        
        // This habit instance should be counted
        totalOccurrences++;
        
        const isCompleted = habitChecks.some(
          (hc: any) => hc.habitId === habit.id && hc.date === dateStr && hc.completed
        );
        if (isCompleted) totalCompleted++;
      }
    }
  }
  
  if (totalOccurrences === 0) {
    // Check for direct goals without habits
    const directGoals = goals.filter(g => g.type === type && g.period === period);
    if (directGoals.length > 0) {
      const goalsWithHabits = directGoals.filter(g => habits.some(h => h.goalId === g.id));
      if (goalsWithHabits.length === 0) {
        // No habits linked, use goal's stored progress
        return Math.round(directGoals.reduce((acc, g) => acc + g.progress, 0) / directGoals.length);
      }
    }
    return 0;
  }
  
  return Math.round((totalCompleted / totalOccurrences) * 100);
};

export const PeriodCard = ({ title, subtitle, type, period, className, onClick, quarterMonths, displayYear }: PeriodCardProps) => {
  const { goals, settings, habits, habitChecks } = useAppStore();

  const averageProgress = calculatePeriodProgressWithChildren(
    type, 
    period, 
    goals, 
    habits, 
    habitChecks,
    displayYear
  );

  const isCircular = settings.progressDisplayMode === 'circular';
  const periodStatus = getPeriodStatus(type, period, displayYear);
  
  const periodGoals = goals.filter((g) => g.type === type && g.period === period);
  const previewGoals = periodGoals.slice(0, 3);
  const remainingCount = periodGoals.length - 3;

  const getMonthProgress = (monthName: string) => {
    const year = displayYear || new Date().getFullYear();
    const monthPeriod = `${monthName} ${year}`;
    const status = getPeriodStatus('monthly', monthPeriod, year);
    
    const progress = calculatePeriodProgressWithChildren(
      'monthly',
      monthPeriod,
      goals,
      habits,
      habitChecks,
      year
    );
    
    return { progress, status };
  };

  return (
    <motion.div
      layout
      className={cn(
        'overflow-hidden relative group rounded-2xl cursor-pointer glass-hover w-full',
        'bg-muted/20 backdrop-blur-sm border border-border/30',
        className
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
    >
      <div 
        className="absolute inset-0"
        style={{ 
          background: 'linear-gradient(135deg, hsl(var(--muted) / 0.4), hsl(var(--card) / 0.6), hsl(var(--muted) / 0.3))'
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-card/30 to-transparent" />

      <div className="relative z-10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {periodStatus === 'past' ? (
              <span className="text-sm font-medium text-muted-foreground/70">Passado</span>
            ) : periodStatus === 'not_started' && averageProgress === 0 ? (
              <span className="text-sm font-medium text-muted-foreground">Não iniciado</span>
            ) : isCircular ? (
              <div className="relative flex items-center justify-center">
                <ProgressCircle progress={averageProgress} />
                <span className="absolute text-xs font-bold">{averageProgress}%</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-gradient-primary">{averageProgress}%</span>
            )}
          </div>
        </div>

        {!isCircular && (
          <div className="progress-bar mb-3">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${averageProgress}%` }}
            />
          </div>
        )}

        {quarterMonths && quarterMonths.length > 0 && (
          <div className="space-y-2 mt-3 pt-3 border-t border-border/20">
            {quarterMonths.map((month) => {
              const { progress: monthProgress, status: monthStatus } = getMonthProgress(month);
              return (
                <div key={month} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground flex-1">{month}</span>
                  {monthStatus === 'past' ? (
                    <span className="text-xs text-muted-foreground/70">Passado</span>
                  ) : monthStatus === 'not_started' && monthProgress === 0 ? (
                    <span className="text-xs text-muted-foreground/70">Não iniciado</span>
                  ) : (
                    <>
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${monthProgress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-primary w-8 text-right">{monthProgress}%</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!quarterMonths && previewGoals.length > 0 && (
          <div className="space-y-1.5 mt-3 pt-3 border-t border-border/20">
            {previewGoals.map((goal) => (
              <div key={goal.id} className="flex items-center gap-2 text-sm">
                {settings.showEmojis && goal.emoji && (
                  <span className="text-xs">{goal.emoji}</span>
                )}
                <span className="text-muted-foreground truncate flex-1">{goal.name}</span>
                <span className="text-xs font-medium text-primary">{goal.progress}%</span>
              </div>
            ))}
            {remainingCount > 0 && (
              <p className="text-xs text-muted-foreground/70">
                +{remainingCount} objetivo{remainingCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {!quarterMonths && periodGoals.length === 0 && (
          <p className="text-sm text-muted-foreground/60 mt-2">
            Nenhum objetivo
          </p>
        )}
      </div>
    </motion.div>
  );
};