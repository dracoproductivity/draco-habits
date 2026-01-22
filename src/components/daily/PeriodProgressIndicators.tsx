import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { calculateHierarchicalPeriodProgress, getPeriodIdentifier } from '@/utils/habitInstanceCalculator';
import { formatPercentage, calculateRawPercentage } from '@/utils/formatPercentage';
import { cn } from '@/lib/utils';

interface PeriodProgressIndicatorsProps {
  className?: string;
}

const CircularProgress = ({ value, label, delay = 0 }: { value: number; label: string; delay?: number }) => {
  const circumference = 2 * Math.PI * 24;
  const offset = circumference - (value / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="flex flex-col items-center"
    >
      <div className="relative w-14 h-14">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="hsl(var(--muted) / 0.3)"
            strokeWidth="3"
          />
          <motion.circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.1 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-foreground">{formatPercentage(value)}%</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground mt-1">{label}</span>
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
        <span className="text-xs font-bold text-foreground">{formatPercentage(value)}%</span>
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

export const PeriodProgressIndicators = ({ className }: PeriodProgressIndicatorsProps) => {
  const { habits, goals, habitChecks, settings, getDailyProgress } = useAppStore();
  
  const isCircular = settings.progressDisplayMode === 'circular';
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Day progress
  const dailyProgress = getDailyProgress(todayStr);

  // Week, Month, Quarter, Year progress using hierarchical X/N for consistency
  const weekPeriod = getPeriodIdentifier(today, 'weekly');
  const monthPeriod = getPeriodIdentifier(today, 'monthly');
  const quarterPeriod = getPeriodIdentifier(today, 'quarterly');
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
    { label: 'Ano', value: yearProgress, delay: 0.2 },
  ];

  return (
    <div className={cn(
      'flex justify-center gap-3',
      isCircular ? 'gap-4' : 'gap-2',
      className
    )}>
      {periods.map((period) => (
        isCircular ? (
          <CircularProgress
            key={period.label}
            value={period.value}
            label={period.label}
            delay={period.delay}
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
