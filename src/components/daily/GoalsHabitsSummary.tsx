import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ListTodo, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

export const GoalsHabitsSummary = () => {
  const { goals, habits } = useAppStore();
  const [showGoals, setShowGoals] = useState(false);
  const [showHabits, setShowHabits] = useState(false);

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {/* Goals Box */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowGoals(true)}
          className="glass-card rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-all"
        >
          <Target className="w-6 h-6 text-primary mb-2" />
          <span className="text-sm font-semibold text-foreground">Objetivos</span>
          <span className="text-2xl font-bold text-primary mt-1">{goals.length}</span>
        </motion.button>

        {/* Habits Box */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowHabits(true)}
          className="glass-card rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-all"
        >
          <ListTodo className="w-6 h-6 text-primary mb-2" />
          <span className="text-sm font-semibold text-foreground">Hábitos</span>
          <span className="text-2xl font-bold text-primary mt-1">{habits.length}</span>
        </motion.button>
      </div>

      {/* Goals Modal */}
      <AnimatePresence>
        {showGoals && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={() => setShowGoals(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md max-h-[80vh] bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/30">
                <h3 className="font-semibold text-lg">Todos os Objetivos ({goals.length})</h3>
                <button onClick={() => setShowGoals(false)} className="p-2 rounded-lg hover:bg-muted/50">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)] space-y-2">
                {goals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum objetivo criado</p>
                ) : (
                  goals.map(goal => (
                    <div key={goal.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/20">
                      {goal.emoji && <span className="text-lg">{goal.emoji}</span>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{goal.name}</p>
                        <p className="text-xs text-muted-foreground">{goal.period}</p>
                      </div>
                      <span className="text-xs font-bold text-primary">{goal.progress}%</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Habits Modal */}
      <AnimatePresence>
        {showHabits && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={() => setShowHabits(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md max-h-[80vh] bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/30">
                <h3 className="font-semibold text-lg">Todos os Hábitos ({habits.length})</h3>
                <button onClick={() => setShowHabits(false)} className="p-2 rounded-lg hover:bg-muted/50">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)] space-y-2">
                {habits.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum hábito criado</p>
                ) : (
                  habits.map(habit => (
                    <div key={habit.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/20">
                      {habit.emoji && <span className="text-lg">{habit.emoji}</span>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{habit.name}</p>
                        {habit.isBadHabit && (
                          <span className="text-[10px] text-destructive font-medium">Mau hábito</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{habit.xpReward} XP</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
