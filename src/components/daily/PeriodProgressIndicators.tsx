import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { calculateHierarchicalPeriodProgress, getPeriodIdentifier } from '@/utils/habitInstanceCalculator';
import { formatPercentage, calculateRawPercentage } from '@/utils/formatPercentage';
import { cn } from '@/lib/utils';
import { ProgressDisplayMode } from '@/types';
import { useResponsive } from '@/hooks/useResponsive';

interface PeriodProgressIndicatorsProps {
  className?: string;
  displayMode?: ProgressDisplayMode;
}

const CircularProgress = ({ value, label, delay = 0, small = false }: { value: number; label: string; delay?: number; small?: boolean }) => {
  const size = small ? 44 : 56;
  const r = small ? 17 : 24;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="flex flex-col items-center"
    >
      <div style={{ width: size, height: size }} className="relative">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="hsl(var(--muted) / 0.3)"
            strokeWidth={small ? 2.5 : 3}
          />
          <motion.circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={small ? 2.5 : 3}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.1 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold text-foreground", small ? "text-[8px]" : "text-[10px]")}>{formatPercentage(value)}</span>
        </div>
      </div>
      <span className={cn("text-muted-foreground mt-1", small ? "text-[8px]" : "text-[10px]")}>{label}</span>
    </motion.div>
  );
};

const LinearProgress = ({ value, label, delay = 0 }: { value: number; label: string; delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex flex-col gap-1 min-w-[60px]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-xs font-bold text-foreground">{formatPercentage(value)}</span>
      </div>
      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--gradient-progress)' }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.1 }}
        />
      </div>
    </motion.div>
  );
};

export const PeriodProgressIndicators = ({ className, displayMode }: PeriodProgressIndicatorsProps) => {
  const { habits, goals, habitChecks, settings, getDailyProgress } = useAppStore();
  const { isDesktop } = useResponsive();

  // Use passed displayMode prop if available, otherwise fall back to settings
  const isCircular = displayMode
    ? displayMode === 'circular'
    : settings.progressDisplayMode === 'circular';
  const today = new Date();

  // Use local timezone formatting to avoid UTC one-day shift
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = formatLocalDate(today);

  // Day progress
  const dailyProgress = getDailyProgress(todayStr);

  // Week, Month, Quarter, Semester, Year progress using hierarchical X/N for consistency
  const weekPeriod = getPeriodIdentifier(today, 'weekly');
  const monthPeriod = getPeriodIdentifier(today, 'monthly');
  const quarterPeriod = getPeriodIdentifier(today, 'quarterly');
  const semesterPeriod = getPeriodIdentifier(today, 'semestral');
  const yearPeriod = getPeriodIdentifier(today, 'yearly');

  const { completed: weekCompleted, total: weekTotal } = calculateHierarchicalPeriodProgress(
    'weekly',
    weekPeriod,
    habits,
    goals,
    habitChecks
  );
  const weekProgress = calculateRawPercentage(weekCompleted, weekTotal);

  const { completed: monthCompleted, total: monthTotal } = calculateHierarchicalPeriodProgress(
    'monthly',
    monthPeriod,
    habits,
    goals,
    habitChecks
  );
  const monthProgress = calculateRawPercentage(monthCompleted, monthTotal);

  const { completed: quarterCompleted, total: quarterTotal } = calculateHierarchicalPeriodProgress(
    'quarterly',
    quarterPeriod,
    habits,
    goals,
    habitChecks
  );
  const quarterProgress = calculateRawPercentage(quarterCompleted, quarterTotal);

  const { completed: semesterCompleted, total: semesterTotal } = calculateHierarchicalPeriodProgress(
    'semestral',
    semesterPeriod,
    habits,
    goals,
    habitChecks
  );
  const semesterProgress = calculateRawPercentage(semesterCompleted, semesterTotal);

  const { completed: yearCompleted, total: yearTotal } = calculateHierarchicalPeriodProgress(
    'yearly',
    yearPeriod,
    habits,
    goals,
    habitChecks
  );
  const yearProgress = calculateRawPercentage(yearCompleted, yearTotal);

  const periods = [
    { label: 'Dia', value: dailyProgress, delay: 0 },
    { label: 'Semana', value: weekProgress, delay: 0.05 },
    { label: 'Mês', value: monthProgress, delay: 0.1 },
    { label: 'Trimestre', value: quarterProgress, delay: 0.15 },
    { label: 'Semestre', value: semesterProgress, delay: 0.2 },
    { label: 'Ano', value: yearProgress, delay: 0.25 },
  ];

  return (
    <div className={cn(
      'flex justify-center',
      isCircular
        ? (isDesktop ? 'gap-4' : 'gap-2')
        : (isDesktop ? 'gap-3' : 'gap-1.5'),
      className
    )}>
      {periods.map((period) => (
        isCircular ? (
          <CircularProgress
            key={period.label}
            value={period.value}
            label={period.label}
            delay={period.delay}
            small={!isDesktop}
          />
        ) : (
          <LinearProgress
            key={period.label}
            value={period.value}
            label={period.label}
            delay={period.delay}
          />
        )
      ))}
    </div>
  );
};
