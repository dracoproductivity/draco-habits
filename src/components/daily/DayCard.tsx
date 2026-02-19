import { motion, AnimatePresence } from 'framer-motion';
import { Minimize2, Sparkles, Flame } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { HabitList } from './HabitList';
import { getHabitsForDate } from '@/utils/habitInstanceCalculator';
import { calculateDayStreak } from '@/utils/calculateDayStreak';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DayCardProps {
  className?: string;
  expanded?: boolean;
  onToggle?: () => void;
}

export const DayCard = ({ className, expanded = false, onToggle }: DayCardProps) => {
  const { habits, goals, dailyLogs, settings, getDailyProgress } = useAppStore();

  // Calculate display data
  const dayNumber = format(new Date(), 'dd');
  const monthName = format(new Date(), 'MMMM', { locale: ptBR });
  const year = format(new Date(), 'yyyy');

  const scheduledHabits = getHabitsForDate(new Date(), habits, goals);
  const completedCount = scheduledHabits.filter(h => {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const log = dailyLogs.find(l => l.date === dateStr && l.habitId === h.id);
    return log?.completed;
  }).length;

  const allCompleted = scheduledHabits.length > 0 && completedCount === scheduledHabits.length;
  const remainingCount = scheduledHabits.length - completedCount;
  const dailyProgress = scheduledHabits.length > 0 ? (completedCount / scheduledHabits.length) * 100 : 0;

  // Calculate streak based on ALL habits
  const dayStreak = calculateDayStreak(habits, dailyLogs, new Date());

  return (
    <AnimatePresence mode="wait">
      {!expanded ? (
        <motion.button
          key="card"
          layoutId="daycard"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={onToggle}
          className={cn(
            "glass-card rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer",
            "hover:border-primary/40 transition-all w-full",
            className
          )}
        >
          {/* Month, Year - above the day number */}
          <span className="text-sm text-muted-foreground capitalize">
            {monthName}, {year}
          </span>

          {/* Day number */}
          <span className="text-6xl font-bold text-foreground leading-none mt-1">
            {dayNumber}
          </span>

          {/* Day streak */}
          {dayStreak > 0 && (() => {
            const rawColor = settings.streakColor || 'hsl(25 95% 55%)';
            const streakColor = rawColor.startsWith('custom:') ? rawColor.replace('custom:', '') : rawColor;
            return (
              <div className="flex items-center gap-1 mt-2">
                <Flame className="w-4 h-4" style={{ color: streakColor }} />
                <span className="text-sm font-semibold" style={{ color: streakColor }}>{dayStreak}</span>
              </div>
            );
          })()}

          {/* Remaining habits or congratulations */}
          <div className="mt-4 text-center">
            {allCompleted ? (
              <div className="flex items-center justify-center gap-1.5 text-primary">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-medium">
                  Parabéns, tudo concluído!
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
            "glass-card rounded-2xl p-4 w-full overflow-hidden relative",
            className
          )}
        >
          <button
            onClick={onToggle}
            className="absolute top-4 right-4 z-20 p-2 rounded-full hover:bg-muted/20 transition-colors"
          >
            <Minimize2 className="w-5 h-5 text-muted-foreground" />
          </button>

          <HabitList />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
