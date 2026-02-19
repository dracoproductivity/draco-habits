import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Habit } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { HabitItem } from './HabitItem';

interface AllHabitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  viewDateStr: string;
  onHabitClick: (habit: Habit) => void;
}

export const AllHabitsModal = ({ isOpen, onClose, habits, viewDateStr, onHabitClick }: AllHabitsModalProps) => {
  const { goals, settings, toggleHabitCheck, incrementMicroGoal, getHabitCheckForDate, habitChecks, toggleDracoSave } = useAppStore();

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
                const linkedGoal = goals.find(g => g.id === habit.goalId);

                return (
                  <HabitItem
                    key={habit.id}
                    habit={habit}
                    linkedGoal={linkedGoal}
                    check={check}
                    showEmojis={settings.showEmojis}
                    onToggle={() => toggleHabitCheck(habit.id, viewDateStr)}
                    onIncrementMicroGoal={() => incrementMicroGoal(habit.id, viewDateStr)}
                    onClick={() => {
                      onHabitClick(habit);
                      onClose();
                    }}
                    habitChecks={habitChecks}
                    delay={index * 0.03}
                    onToggleDracoSave={() => toggleDracoSave(habit.id, viewDateStr)}
                    dracoSaves={settings.dracoSaves || 0}
                  />
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
