import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Bell, Flame } from 'lucide-react';
import { Habit, Goal } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { calculateHabitStreak } from '@/utils/calculateStreak';

interface AllHabitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  viewDateStr: string;
  onHabitClick: (habit: Habit) => void;
}

const WEEK_DAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

export const AllHabitsModal = ({ isOpen, onClose, habits, viewDateStr, onHabitClick }: AllHabitsModalProps) => {
  const { goals, settings, toggleHabitCheck, getHabitCheckForDate, habitChecks } = useAppStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[80vh] bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-lg">Todos os Hábitos do Dia</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Habits list */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)] space-y-2">
              {habits.map((habit, index) => {
                const check = getHabitCheckForDate(habit.id, viewDateStr);
                const isCompleted = check?.completed ?? false;
                const linkedGoal = goals.find(g => g.id === habit.goalId);
                const streak = calculateHabitStreak(habit, habitChecks, linkedGoal);

                return (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl transition-all group cursor-pointer',
                      isCompleted 
                        ? 'bg-primary/15 opacity-90' 
                        : 'hover:bg-muted/20'
                    )}
                    onClick={() => {
                      onHabitClick(habit);
                      onClose();
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleHabitCheck(habit.id, viewDateStr);
                      }}
                      className={cn(
                        'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
                        isCompleted 
                          ? 'bg-primary border-primary' 
                          : 'border-muted-foreground/50 hover:border-primary'
                      )}
                    >
                      {isCompleted && <Check className="w-4 h-4 text-primary-foreground" />}
                    </button>

                    <div className="flex-1 flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        {settings.showEmojis && habit.emoji && (
                          <span className="text-lg">{habit.emoji}</span>
                        )}
                        <span className={cn(
                          'font-medium transition-all',
                          isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                        )}>
                          {habit.name}
                        </span>
                      </div>
                      {linkedGoal && (
                        <span className="text-xs text-muted-foreground">
                          🎯 {linkedGoal.name}
                        </span>
                      )}
                      {habit.weekDays && habit.weekDays.length > 0 && habit.weekDays.length < 7 && (
                        <span className="text-xs text-muted-foreground/70">
                          {habit.weekDays.map(d => WEEK_DAYS[d]?.label).join(', ')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {streak > 0 && (
                        <div className="flex items-center gap-0.5 text-muted-foreground">
                          <Flame className="w-3.5 h-3.5 text-orange-400" />
                          <span className="text-xs">{streak}</span>
                        </div>
                      )}
                      {habit.notificationEnabled && (
                        <Bell className="w-3.5 h-3.5 text-primary" />
                      )}
                      <span className="text-xs text-muted-foreground">+{habit.xpReward} XP</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
