import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { GoalType, ProgressDisplayMode } from '@/types';
import { cn } from '@/lib/utils';
import { 
  calculateHierarchicalPeriodProgress 
} from '@/utils/habitInstanceCalculator';
import { formatPercentage, calculateRawPercentage } from '@/utils/formatPercentage';

interface HierarchicalYearProgressProps {
  displayYear: number;
  displayMode?: ProgressDisplayMode;
  onPeriodClick?: (title: string, type: GoalType, period: string, subtitle?: string, quarterMonths?: string[]) => void;
}

const QUARTER_MONTHS: Record<number, string[]> = {
  1: ['Janeiro', 'Fevereiro', 'Março'],
  2: ['Abril', 'Maio', 'Junho'],
  3: ['Julho', 'Agosto', 'Setembro'],
  4: ['Outubro', 'Novembro', 'Dezembro'],
};

const SEMESTER_QUARTERS: Record<number, number[]> = {
  1: [1, 2],
  2: [3, 4],
};

const ProgressCircle = ({ progress, size = 32 }: { progress: number; size?: number }) => {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="hsl(var(--muted))"
        strokeWidth="3"
        fill="none"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="hsl(var(--primary))"
        strokeWidth="3"
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

const ProgressBar = ({ progress, className }: { progress: number; className?: string }) => (
  <div className={cn("progress-bar h-1.5", className)}>
    <motion.div
      className="progress-fill"
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.3 }}
    />
  </div>
);

interface PeriodBoxProps {
  title: string;
  progress: number;
  isCircular: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

const PeriodBox = ({ title, progress, isCircular, size = 'small', onClick }: PeriodBoxProps) => {
  const sizeClasses = {
    small: 'p-2',
    medium: 'p-3',
    large: 'p-4',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "bg-muted/30 border border-border/30 rounded-xl transition-all hover:bg-muted/50 text-left w-full",
        sizeClasses[size]
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn(
          "font-medium text-foreground truncate",
          size === 'small' && 'text-xs',
          size === 'medium' && 'text-sm',
          size === 'large' && 'text-base'
        )}>
          {title}
        </span>
        {isCircular ? (
          <div className="relative flex items-center justify-center flex-shrink-0">
            <ProgressCircle progress={progress} size={size === 'small' ? 24 : 32} />
            <span className={cn(
              "absolute font-bold",
              size === 'small' && 'text-[8px]',
              size === 'medium' && 'text-[10px]',
              size === 'large' && 'text-xs'
            )}>
              {Math.round(progress)}%
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 max-w-[60%]">
            <ProgressBar progress={progress} className="flex-1" />
            <span className={cn(
              "font-bold text-primary flex-shrink-0",
              size === 'small' && 'text-[10px]',
              size === 'medium' && 'text-xs',
              size === 'large' && 'text-sm'
            )}>
              {formatPercentage(progress)}
            </span>
          </div>
        )}
      </div>
    </motion.button>
  );
};

export const HierarchicalYearProgress = ({ displayYear, displayMode, onPeriodClick }: HierarchicalYearProgressProps) => {
  const { habits, goals, habitChecks, settings } = useAppStore();
  // Use passed displayMode if available, otherwise fall back to settings
  const isCircular = displayMode 
    ? displayMode === 'circular' 
    : settings.progressDisplayMode === 'circular';

  const calculateProgress = (type: GoalType, period: string) => {
    const { completed, total } = calculateHierarchicalPeriodProgress(type, period, habits, goals, habitChecks);
    return calculateRawPercentage(completed, total);
  };

  const yearProgress = calculateProgress('yearly', displayYear.toString());

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-muted/20 backdrop-blur-sm border border-border/30 rounded-2xl p-4 max-w-3xl mx-auto"
    >
      {/* Year Header - Clickable */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => onPeriodClick?.(`Ano ${displayYear}`, 'yearly', displayYear.toString())}
        className="w-full hover:bg-muted/30 rounded-xl p-2 -m-2 transition-colors"
      >
        <div className="flex flex-col items-center mb-4">
          <h3 className="font-semibold text-lg text-foreground text-center">Ano {displayYear}</h3>
          {isCircular ? (
            <div className="relative flex items-center justify-center mt-2">
              <ProgressCircle progress={yearProgress} size={50} />
              <span className="absolute text-xs font-bold">{formatPercentage(yearProgress)}</span>
            </div>
          ) : (
            <span className="text-2xl font-bold text-gradient-primary mt-1">{formatPercentage(yearProgress)}</span>
          )}
        </div>

        {!isCircular && <ProgressBar progress={yearProgress} className="mb-2 max-w-md mx-auto" />}
      </motion.button>

      {/* Semesters side by side */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {[1, 2].map((semester) => {
          const semesterPeriod = `${semester}º Sem - ${displayYear}`;
          const semesterProgress = calculateProgress('semestral', semesterPeriod);
          const quarters = SEMESTER_QUARTERS[semester];

          return (
            <div
              key={semester}
              className="bg-muted/30 border border-border/30 rounded-xl p-3"
            >
              {/* Semester Header */}
              <div
                className="flex flex-col items-center mb-3 cursor-pointer hover:opacity-80"
                onClick={() => onPeriodClick?.(`${semester}º Semestre`, 'semestral', semesterPeriod)}
              >
                <span className="font-medium text-sm text-foreground text-center">{semester}º Semestre</span>
                {isCircular ? (
                  <div className="relative flex items-center justify-center mt-1">
                    <ProgressCircle progress={semesterProgress} size={28} />
                    <span className="absolute text-[8px] font-bold">{Math.round(semesterProgress)}%</span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-primary mt-1">{formatPercentage(semesterProgress)}</span>
                )}
              </div>

              {!isCircular && <ProgressBar progress={semesterProgress} className="mb-3 max-w-[120px] mx-auto" />}

              {/* Quarters inside semester */}
              <div className="space-y-2">
                {quarters.map((quarter) => {
                  const quarterPeriod = `${quarter}º Tri - ${displayYear}`;
                  const quarterProgress = calculateProgress('quarterly', quarterPeriod);
                  const months = QUARTER_MONTHS[quarter];

                  return (
                    <div
                      key={quarter}
                      className="bg-muted/40 border border-border/20 rounded-lg p-2"
                    >
                      {/* Quarter Header */}
                      <div
                        className="flex flex-col items-center mb-2 cursor-pointer hover:opacity-80"
                        onClick={() => onPeriodClick?.(`${quarter}º Trimestre`, 'quarterly', quarterPeriod, undefined, months)}
                      >
                        <span className="font-medium text-xs text-foreground text-center">{quarter}º Tri</span>
                        {isCircular ? (
                          <div className="relative flex items-center justify-center mt-1">
                            <ProgressCircle progress={quarterProgress} size={22} />
                            <span className="absolute text-[6px] font-bold">{Math.round(quarterProgress)}%</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-primary mt-1">{formatPercentage(quarterProgress)}</span>
                        )}
                      </div>

                      {!isCircular && <ProgressBar progress={quarterProgress} className="mb-2 max-w-[80px] mx-auto" />}

                      {/* Months inside quarter */}
                      <div className="space-y-1">
                        {months.map((month) => {
                          const monthPeriod = `${month} ${displayYear}`;
                          const monthProgress = calculateProgress('monthly', monthPeriod);

                          return (
                            <PeriodBox
                              key={month}
                              title={month.slice(0, 3)}
                              progress={monthProgress}
                              isCircular={isCircular}
                              size="small"
                              onClick={() => onPeriodClick?.(month, 'monthly', monthPeriod)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
