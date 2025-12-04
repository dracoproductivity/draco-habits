import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { GoalType } from '@/types';
import { cn } from '@/lib/utils';

interface PeriodItemProps {
  title: string;
  subtitle?: string;
  type: GoalType;
  period: string;
  className?: string;
  onClick?: () => void;
}

export const PeriodItem = ({ title, subtitle, type, period, className, onClick }: PeriodItemProps) => {
  const { goals, settings } = useAppStore();

  const periodGoals = goals.filter((g) => g.type === type && g.period === period);
  const averageProgress = periodGoals.length > 0
    ? Math.round(periodGoals.reduce((acc, g) => acc + g.progress, 0) / periodGoals.length)
    : 0;

  const isCircular = settings.progressDisplayMode === 'circular';

  return (
    <motion.div
      className={cn(
        'cursor-pointer py-6 px-2 text-center transition-all',
        'hover:bg-muted/20 rounded-xl',
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {/* Title */}
      <h3 className="font-semibold text-lg text-foreground mb-1">{title}</h3>
      
      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
      )}

      {/* Large Progress */}
      {isCircular ? (
        <div className="relative flex items-center justify-center mx-auto w-20 h-20 mb-2">
          <svg width="80" height="80" className="transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="35"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
              fill="none"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="35"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDashoffset: 2 * Math.PI * 35 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 35 - (averageProgress / 100) * 2 * Math.PI * 35 }}
              style={{ strokeDasharray: 2 * Math.PI * 35 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </svg>
          <span className="absolute text-xl font-bold text-gradient-primary">{averageProgress}%</span>
        </div>
      ) : (
        <div className="text-4xl font-bold text-gradient-primary mb-2">
          {averageProgress}%
        </div>
      )}

      {/* Goals count */}
      {periodGoals.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {periodGoals.length} objetivo{periodGoals.length !== 1 ? 's' : ''}
        </p>
      )}
    </motion.div>
  );
};
