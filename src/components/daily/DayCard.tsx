import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minimize2, Sparkles, Flame } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { HabitList } from './HabitList';
import { getHabitsForDate } from '@/utils/habitInstanceCalculator';
import { calculateDayStreak } from '@/utils/calculateDayStreak';
import { formatLocalDate } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const STORAGE_KEY = 'draco-daycard-expanded';

interface DayCardProps {
  className?: string;
}

export const DayCard = ({ className }: DayCardProps) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const { habits, habitChecks, goals, getDailyProgress, settings } = useAppStore();

  const today = new Date();
  const todayStr = formatLocalDate(today);
  const dayNumber = today.getDate();
  const monthName = MONTHS_PT[today.getMonth()];
  const year = today.getFullYear();

  // Day streak calculation
  const dayStreak = useMemo(() => {
    return calculateDayStreak(habits, habitChecks, goals);
  }, [habits, habitChecks, goals]);

  // Persist expanded state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isExpanded));
    } catch { }
  }, [isExpanded]);

  const scheduledHabits = useMemo(() => {
    return getHabitsForDate(today, habits, goals);
  }, [today, habits, goals]);

  const completedCount = useMemo(() => {
    return habitChecks.filter(
      hc => hc.date === todayStr && hc.completed && scheduledHabits.some(h => h.id === hc.habitId)
    ).length;
  }, [habitChecks, todayStr, scheduledHabits]);

  const remainingCount = scheduledHabits.length - completedCount;
  const allCompleted = scheduledHabits.length > 0 && remainingCount === 0;
  const dailyProgress = getDailyProgress(todayStr);

  return (
    <AnimatePresence mode="wait">
      {!isExpanded ? (
        <motion.button
          key="card"
          layoutId="daycard"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={() => setIsExpanded(true)}
          className={cn(
            "glass-card rounded-2xl p-5 flex items-center gap-4 cursor-pointer",
            "hover:border-primary/40 transition-all w-full",
            className
          )}
        >
          {/* Day number */}
          <div className="flex flex-col items-center min-w-[60px]">
            <span className="text-4xl font-bold text-foreground leading-none">
              {dayNumber}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              {monthName}
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-12 bg-border/50" />

          {/* Info section */}
          <div className="flex-1 flex flex-col gap-1.5">
            {/* Streak + status */}
            <div className="flex items-center gap-3">
              {dayStreak > 0 && (() => {
                const rawColor = settings.streakColor || 'hsl(25 95% 55%)';
                const streakColor = rawColor.startsWith('custom:') ? rawColor.replace('custom:', '') : rawColor;
                return (
                  <div className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" style={{ color: streakColor }} />
                    <span className="text-xs font-semibold" style={{ color: streakColor }}>{dayStreak}</span>
                  </div>
                );
              })()}
              {allCompleted ? (
                <div className="flex items-center gap-1 text-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Tudo concluído!</span>
                </div>
              ) : scheduledHabits.length === 0 ? (
                <span className="text-xs text-muted-foreground">Nenhum hábito programado</span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {remainingCount} hábito{remainingCount !== 1 ? 's' : ''} restante{remainingCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--gradient-progress)' }}
                initial={{ width: 0 }}
                animate={{ width: `${dailyProgress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.button>
      ) : (
        <motion.div
          key="expanded"
          layoutId="daycard"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            "glass-card rounded-2xl p-4 w-full overflow-hidden",
            className
          )}
        >
          {/* Minimize button */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
            <span className="text-sm text-muted-foreground">
              {dayNumber} de {monthName}, {year}
            </span>
          </div>

          {/* Habit list */}
          <HabitList showProgressIndicators={false} centerTitle />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
