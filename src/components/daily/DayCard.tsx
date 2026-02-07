import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minimize2, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { HabitList } from './HabitList';
import { getHabitsForDate } from '@/utils/habitInstanceCalculator';
import { formatLocalDate } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface DayCardProps {
  className?: string;
}

export const DayCard = ({ className }: DayCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { habits, habitChecks, goals, getDailyProgress } = useAppStore();

  const today = new Date();
  const todayStr = formatLocalDate(today);
  const dayNumber = today.getDate();
  const monthName = MONTHS_PT[today.getMonth()];
  const year = today.getFullYear();

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
            "glass-card rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer",
            "hover:border-primary/40 transition-all w-full aspect-square max-w-[280px]",
            className
          )}
        >
          {/* Day number */}
          <span className="text-6xl font-bold text-foreground leading-none">
            {dayNumber}
          </span>

          {/* Month, Year */}
          <span className="text-sm text-muted-foreground mt-2">
            {monthName}, {year}
          </span>

          {/* Remaining habits or congratulations */}
          <div className="mt-4">
            {allCompleted ? (
              <div className="flex items-center gap-1.5 text-primary">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-medium text-center">
                  Parabéns, você concluiu todos os hábitos de hoje!
                </span>
              </div>
            ) : scheduledHabits.length === 0 ? (
              <span className="text-xs text-muted-foreground">Nenhum hábito programado</span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {remainingCount} hábito{remainingCount !== 1 ? 's' : ''} restante{remainingCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Mini progress indicator */}
          <div className="w-full mt-4 h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--gradient-progress)' }}
              initial={{ width: 0 }}
              animate={{ width: `${dailyProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
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
            "glass-card rounded-2xl p-4 w-full",
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
