import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Habit } from '@/types';
import { isWithinInterval, startOfQuarter, endOfQuarter, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addWeeks, startOfYear } from 'date-fns';

interface CalendarDayModalProps {
  date: string;
  onClose: () => void;
}

// Check if a habit should appear on a specific date based on its period
const isHabitActiveOnDate = (habit: Habit, date: Date, goals: any[]): boolean => {
  // If no goal linked, check weekdays
  if (!habit.goalId) {
    if (habit.isOneTime) return true;
    if (!habit.weekDays || habit.weekDays.length === 0) return true;
    return habit.weekDays.includes(date.getDay());
  }
  
  // Get linked goal to determine period
  const linkedGoal = goals.find(g => g.id === habit.goalId);
  if (!linkedGoal) {
    if (habit.isOneTime) return true;
    if (!habit.weekDays || habit.weekDays.length === 0) return true;
    return habit.weekDays.includes(date.getDay());
  }
  
  const period = linkedGoal.period;
  const type = linkedGoal.type;
  
  // Check if date is within the goal's period
  let isWithinPeriod = false;
  
  switch (type) {
    case 'yearly': {
      const year = parseInt(period);
      isWithinPeriod = date.getFullYear() === year;
      break;
    }
    case 'quarterly': {
      const match = period.match(/(\d+)º Tri - (\d+)/);
      if (match) {
        const quarter = parseInt(match[1]);
        const year = parseInt(match[2]);
        const quarterStart = startOfQuarter(new Date(year, (quarter - 1) * 3, 1));
        const quarterEnd = endOfQuarter(quarterStart);
        isWithinPeriod = isWithinInterval(date, { start: quarterStart, end: quarterEnd });
      }
      break;
    }
    case 'monthly': {
      const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const parts = period.split(' ');
      const monthIndex = months.indexOf(parts[0]);
      const year = parseInt(parts[1]);
      if (monthIndex !== -1) {
        isWithinPeriod = date.getFullYear() === year && date.getMonth() === monthIndex;
      }
      break;
    }
    case 'weekly': {
      const match = period.match(/Semana (\d+) - (\d+)/);
      if (match) {
        const weekNum = parseInt(match[1]);
        const year = parseInt(match[2]);
        const yearStart = startOfYear(new Date(year, 0, 1));
        const weekStart = startOfWeek(addWeeks(yearStart, weekNum - 1), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        isWithinPeriod = isWithinInterval(date, { start: weekStart, end: weekEnd });
      }
      break;
    }
  }
  
  if (!isWithinPeriod) return false;
  
  // Now check weekdays
  if (habit.isOneTime) return true;
  if (!habit.weekDays || habit.weekDays.length === 0) return true;
  return habit.weekDays.includes(date.getDay());
};

export const CalendarDayModal = ({ date, onClose }: CalendarDayModalProps) => {
  const { habits, goals, habitChecks, toggleHabitCheck } = useAppStore();
  
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Get habits active on this date
  const activeHabits = habits.filter(habit => isHabitActiveOnDate(habit, dateObj, goals));

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
            <X className="w-5 h-5" />
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
                    {completed && <Check className="w-4 h-4 text-primary-foreground" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      'text-sm font-medium transition-all',
                      completed && 'line-through text-muted-foreground'
                    )}>
                      {habit.emoji && `${habit.emoji} `}{habit.name}
                    </span>
                    {linkedGoal && (
                      <p className="text-xs text-muted-foreground truncate">
                        {linkedGoal.emoji && `${linkedGoal.emoji} `}{linkedGoal.name}
                      </p>
                    )}
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