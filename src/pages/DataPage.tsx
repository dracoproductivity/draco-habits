import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, ChevronRight, RotateCcw } from 'lucide-react';
import { createPortal } from 'react-dom';
import { UniversalHeader } from '@/components/layout/UniversalHeader';
import { AnnualProgressView } from '@/components/analytics/AnnualProgressView';
import { HabitCalendar } from '@/components/daily/HabitCalendar';
import { ProgressDisplayToggle } from '@/components/ui/ProgressDisplayToggle';
import { HabitDetailModal } from '@/components/daily/HabitDetailModal';
import { useAppStore } from '@/store/useAppStore';
import { useResponsive } from '@/hooks/useResponsive';
import { ProgressDisplayMode, Goal, Habit } from '@/types';
import { cn } from '@/lib/utils';
import { formatPercentage } from '@/utils/formatPercentage';
import { toast } from '@/hooks/use-toast';

export const DataPage = () => {
  const { settings, updateSettings, goals, habits, updateGoal, updateHabit } = useAppStore();
  const { isDesktop } = useResponsive();
  
  const [localDisplayMode, setLocalDisplayMode] = useState<ProgressDisplayMode>(
    settings.pageProgressDisplayModes?.analytics || settings.progressDisplayMode
  );
  const [showArchived, setShowArchived] = useState(false);
  const [selectedArchivedHabit, setSelectedArchivedHabit] = useState<Habit | null>(null);
  const [selectedArchivedGoal, setSelectedArchivedGoal] = useState<Goal | null>(null);
  
  const toggleDisplayMode = () => {
    const newMode = localDisplayMode === 'linear' ? 'circular' : 'linear';
    setLocalDisplayMode(newMode);
    updateSettings({
      pageProgressDisplayModes: {
        ...settings.pageProgressDisplayModes,
        home: settings.pageProgressDisplayModes?.home || settings.progressDisplayMode,
        goals: settings.pageProgressDisplayModes?.goals || settings.progressDisplayMode,
        analytics: newMode,
      }
    });
  };

  const archivedGoals = goals.filter(g => g.archived);
  const archivedHabits = habits.filter(h => h.archived);
  const archivedCount = archivedGoals.length + archivedHabits.length;

  const handleUnarchiveGoal = (goal: Goal) => {
    updateGoal(goal.id, { archived: false });
    toast({ title: 'Objetivo desarquivado!', description: `"${goal.name}" voltou para os objetivos ativos.` });
  };

  const handleUnarchiveHabit = (habit: Habit) => {
    updateHabit(habit.id, { archived: false });
    toast({ title: 'Hábito desarquivado!', description: `"${habit.name}" voltou para os hábitos ativos.` });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen ${isDesktop ? 'pb-8' : 'pb-20'}`}
    >
      <UniversalHeader />

      <div className="p-4">
        {/* Progress Display Toggle */}
        <div className="flex justify-end mb-4">
          <ProgressDisplayToggle mode={localDisplayMode} onToggle={toggleDisplayMode} />
        </div>

        {/* Annual Progress View */}
        <AnnualProgressView displayMode={localDisplayMode} />

        {/* Calendar */}
        <div className="glass-card rounded-2xl p-4 mt-6">
          <h3 className="font-semibold text-foreground mb-4 text-center">Calendário de Hábitos</h3>
          <HabitCalendar />
        </div>

        {/* Archived Section */}
        <button
          onClick={() => setShowArchived(true)}
          className="glass-card rounded-2xl p-4 mt-6 w-full flex items-center justify-between hover:border-primary/40 transition-all"
        >
          <div className="flex items-center gap-3">
            <Archive className="w-5 h-5 text-muted-foreground" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Arquivados</h3>
              <p className="text-xs text-muted-foreground">
                {archivedCount} item{archivedCount !== 1 ? 's' : ''} arquivado{archivedCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Archived Modal */}
      {showArchived && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowArchived(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-card border border-border/50 rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-border/50 p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Arquivados</h3>
              </div>
              <button onClick={() => setShowArchived(false)} className="p-2 rounded-lg hover:bg-muted/50">
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Archived Goals */}
              {archivedGoals.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Objetivos</h4>
                  <div className="space-y-2">
                    {archivedGoals.map(goal => (
                      <div key={goal.id} className="glass-card rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {goal.emoji && <span className="text-lg">{goal.emoji}</span>}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{goal.name}</p>
                              <p className="text-xs text-muted-foreground">{goal.period} • {formatPercentage(goal.progress)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnarchiveGoal(goal)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Desarquivar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Archived Habits */}
              {archivedHabits.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Hábitos</h4>
                  <div className="space-y-2">
                    {archivedHabits.map(habit => (
                      <div key={habit.id} className="glass-card rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {habit.emoji && <span className="text-lg">{habit.emoji}</span>}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{habit.name}</p>
                              <p className="text-xs text-muted-foreground">{habit.xpReward} XP</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnarchiveHabit(habit)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Desarquivar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {archivedCount === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Nenhum item arquivado
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}

      {/* Habit Detail Modal for archived habits */}
      {selectedArchivedHabit && (
        <HabitDetailModal
          habit={selectedArchivedHabit}
          isOpen={!!selectedArchivedHabit}
          onClose={() => setSelectedArchivedHabit(null)}
        />
      )}
    </motion.div>
  );
};
