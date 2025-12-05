import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { GoalType } from '@/types';
import { cn } from '@/lib/utils';

interface PeriodCardProps {
  title: string;
  subtitle?: string;
  type: GoalType;
  period: string;
  className?: string;
  onClick?: () => void;
  quarterMonths?: string[]; // For quarterly cards, show month progress
  displayYear?: number; // Year being displayed
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Check if a period has started
const isPeriodStarted = (type: GoalType, period: string, displayYear?: number): boolean => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentQuarter = Math.ceil((currentMonth + 1) / 3);
  
  const yearToCheck = displayYear || currentYear;
  
  if (yearToCheck > currentYear) return false;
  if (yearToCheck < currentYear) return true;
  
  // Same year - check period
  if (type === 'yearly') return true;
  
  if (type === 'quarterly') {
    const quarterMatch = period.match(/(\d+)º Tri/);
    if (quarterMatch) {
      const quarter = parseInt(quarterMatch[1]);
      return quarter <= currentQuarter;
    }
  }
  
  if (type === 'monthly') {
    const monthName = period.split(' ')[0];
    const monthIndex = MONTH_NAMES.indexOf(monthName);
    return monthIndex !== -1 && monthIndex <= currentMonth;
  }
  
  if (type === 'weekly') {
    const weekMatch = period.match(/Semana (\d+)/);
    const yearMatch = period.match(/(\d{4})/);
    if (weekMatch) {
      const week = parseInt(weekMatch[1]);
      const periodYear = yearMatch ? parseInt(yearMatch[1]) : currentYear;
      
      if (periodYear > currentYear) return false;
      if (periodYear < currentYear) return true;
      
      const currentWeek = Math.ceil(
        (now.getTime() - new Date(currentYear, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      return week <= currentWeek;
    }
  }
  
  return true;
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

export const PeriodCard = ({ title, subtitle, type, period, className, onClick, quarterMonths, displayYear }: PeriodCardProps) => {
  const { goals, settings } = useAppStore();

  const periodGoals = goals.filter((g) => g.type === type && g.period === period);
  const averageProgress = periodGoals.length > 0
    ? Math.round(periodGoals.reduce((acc, g) => acc + g.progress, 0) / periodGoals.length)
    : 0;

  const isCircular = settings.progressDisplayMode === 'circular';
  const hasStarted = isPeriodStarted(type, period, displayYear);
  
  // Get first 3 goals for preview
  const previewGoals = periodGoals.slice(0, 3);
  const remainingCount = periodGoals.length - 3;

  // Calculate monthly progress for quarters
  const getMonthProgress = (monthName: string) => {
    const year = displayYear || new Date().getFullYear();
    const monthPeriod = `${monthName} ${year}`;
    const monthGoals = goals.filter((g) => g.type === 'monthly' && g.period === monthPeriod);
    if (monthGoals.length === 0) return { progress: 0, hasStarted: isPeriodStarted('monthly', monthPeriod, year) };
    return { 
      progress: Math.round(monthGoals.reduce((acc, g) => acc + g.progress, 0) / monthGoals.length),
      hasStarted: isPeriodStarted('monthly', monthPeriod, year)
    };
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
      {/* Neutral gradient background */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: 'linear-gradient(135deg, hsl(var(--muted) / 0.4), hsl(var(--card) / 0.6), hsl(var(--muted) / 0.3))'
        }}
      />
      
      {/* Additional overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-card/30 to-transparent" />

      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!hasStarted && averageProgress === 0 ? (
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

        {/* Linear Progress bar */}
        {!isCircular && (
          <div className="progress-bar mb-3">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${averageProgress}%` }}
            />
          </div>
        )}

        {/* Monthly progress for quarters */}
        {quarterMonths && quarterMonths.length > 0 && (
          <div className="space-y-2 mt-3 pt-3 border-t border-border/20">
            {quarterMonths.map((month) => {
              const { progress: monthProgress, hasStarted: monthHasStarted } = getMonthProgress(month);
              return (
                <div key={month} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground flex-1">{month}</span>
                  {!monthHasStarted && monthProgress === 0 ? (
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

        {/* Goals Preview (sub-subtitles) - only for non-quarterly */}
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

        {/* Summary if no goals */}
        {!quarterMonths && periodGoals.length === 0 && (
          <p className="text-sm text-muted-foreground/60 mt-2">
            Nenhum objetivo
          </p>
        )}
      </div>
    </motion.div>
  );
};
