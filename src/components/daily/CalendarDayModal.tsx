import { motion } from 'framer-motion';
import { X as CloseIcon, Check, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Habit } from '@/types';
import { 
  isHabitScheduledForDate, 
  calculateHabitProgress 
} from '@/utils/habitInstanceCalculator';

interface CalendarDayModalProps {
  date: string;
  onClose: () => void;
}

export const CalendarDayModal = ({ date, onClose }: CalendarDayModalProps) => {
  const { habits, goals, habitChecks, toggleHabitCheck, settings } = useAppStore();
  
  // Parse date string as local timezone (not UTC)
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  
  const formattedDate = dateObj.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Get habits active on this date using the new utility
  const activeHabits = habits.filter(habit => {
    const linkedGoal = habit.goalId ? goals.find(g => g.id === habit.goalId) : null;
    return isHabitScheduledForDate(habit, dateObj, linkedGoal);
  });

  const isHabitCompleted = (habitId: string) => {
    const check = habitChecks.find(hc => hc.habitId === habitId && hc.date === date);
    return check?.completed || false;
  };

  const completedCount = activeHabits.filter(h => isHabitCompleted(h.id)).length;
  const percentage = activeHabits.length > 0 ? Math.round((completedCount / activeHabits.length) * 100) : 0;

  const getPercentageColor = (pct: number) => {
    if (pct === 0) return 'text-muted-foreground';
    if (pct <= 25) return 'text-red-500';
    if (pct <= 50) return 'text-orange-500';
    if (pct <= 75) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Get habit progress (X/N)
  const getHabitProgressDisplay = (habit: Habit) => {
    const linkedGoal = habit.goalId ? goals.find(g => g.id === habit.goalId) : null;
    const progress = calculateHabitProgress(habit, linkedGoal, habitChecks);
    return progress;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div>
            <h3 className="font-semibold text-foreground capitalize">{formattedDate}</h3>
            <p className={cn('text-sm font-medium', getPercentageColor(percentage))}>
              {completedCount}/{activeHabits.length} concluídos ({percentage}%)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Habits list */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
          {activeHabits.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum hábito programado para este dia
            </p>
          ) : (
            activeHabits.map((habit, index) => {
              const completed = isHabitCompleted(habit.id);
              const linkedGoal = goals.find(g => g.id === habit.goalId);
              const progress = getHabitProgressDisplay(habit);
              
              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer',
                    completed ? 'bg-primary/10' : 'bg-muted/30 hover:bg-muted/50'
                  )}
                  onClick={() => toggleHabitCheck(habit.id, date)}
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded-lg flex items-center justify-center transition-all',
                      completed 
                        ? 'gradient-primary' 
                        : 'border-2 border-muted-foreground/30 hover:border-primary/50'
                    )}
                  >
                    {completed && (
                      habit.isBadHabit ? (
                        <X className="w-4 h-4 text-primary-foreground" />
                      ) : (
                        <Check className="w-4 h-4 text-primary-foreground" />
                      )
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {settings.showEmojis && habit.emoji && (
                        <span className="text-sm">{habit.emoji}</span>
                      )}
                      <span className={cn(
                        'text-sm font-medium transition-all',
                        completed && 'line-through text-muted-foreground'
                      )}>
                        {habit.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {linkedGoal && (
                        <p className="text-xs text-muted-foreground truncate">
                          {linkedGoal.emoji && `${linkedGoal.emoji} `}{linkedGoal.name}
                        </p>
                      )}
                      <span className="text-xs text-primary font-semibold">
                        {progress.completed}/{progress.total}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {progress.percentage}%
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
