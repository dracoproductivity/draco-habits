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
}

const themeGradients: Record<string, string> = {
  fire: 'linear-gradient(135deg, hsl(32 95% 25% / 0.8), hsl(15 90% 20% / 0.6), hsl(32 70% 15% / 0.4))',
  purple: 'linear-gradient(135deg, hsl(270 80% 30% / 0.8), hsl(280 70% 25% / 0.6), hsl(260 60% 15% / 0.4))',
  emerald: 'linear-gradient(135deg, hsl(160 80% 25% / 0.8), hsl(140 70% 20% / 0.6), hsl(150 60% 15% / 0.4))',
  ocean: 'linear-gradient(135deg, hsl(200 80% 30% / 0.8), hsl(220 70% 25% / 0.6), hsl(210 60% 15% / 0.4))',
  rose: 'linear-gradient(135deg, hsl(340 80% 35% / 0.8), hsl(320 70% 30% / 0.6), hsl(330 60% 20% / 0.4))',
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

export const PeriodCard = ({ title, subtitle, type, period, className, onClick }: PeriodCardProps) => {
  const { goals, settings } = useAppStore();

  const periodGoals = goals.filter((g) => g.type === type && g.period === period);
  const averageProgress = periodGoals.length > 0
    ? Math.round(periodGoals.reduce((acc, g) => acc + g.progress, 0) / periodGoals.length)
    : 0;

  const currentGradient = themeGradients[settings.themeColor] || themeGradients.fire;
  const isCircular = settings.progressDisplayMode === 'circular';

  return (
    <motion.div
      layout
      className={cn(
        'overflow-hidden relative group rounded-2xl cursor-pointer glass-hover',
        'bg-card/30 backdrop-blur-sm border border-border/30',
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {/* Theme gradient background */}
      <div 
        className="absolute inset-0"
        style={{ background: currentGradient }}
      />
      
      {/* Additional overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/40 to-transparent" />

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
            {isCircular ? (
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

        {/* Summary */}
        {periodGoals.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {periodGoals.length} objetivo{periodGoals.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </motion.div>
  );
};
