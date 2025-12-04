import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { GoalCard } from '@/components/goals/GoalCard';
import { Goal } from '@/types';
import { cn } from '@/lib/utils';

type FilterType = 'all' | Goal['type'];

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
];

export const GoalsPage = () => {
  const { goals, updateGoal, removeGoal, settings } = useAppStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const typeLabels: Record<Goal['type'], string> = {
    weekly: 'Semanal',
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    yearly: 'Anual',
  };

  const typeColors: Record<Goal['type'], string> = {
    weekly: 'bg-success/10 text-success border border-success/30',
    monthly: 'bg-primary/10 text-primary border border-primary/30',
    quarterly: 'bg-secondary/10 text-secondary border border-secondary/30',
    yearly: 'gradient-fire text-primary-foreground',
  };

  const filteredGoals = filter === 'all'
    ? goals
    : goals.filter((g) => g.type === filter);

  const handleProgressChange = (value: number) => {
    if (selectedGoal) {
      updateGoal(selectedGoal.id, { progress: value });
      setSelectedGoal({ ...selectedGoal, progress: value });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-20 p-4"
    >
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gradient-fire">Objetivos</h1>
        <p className="text-muted-foreground">Acompanhe seu progresso</p>
      </header>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto hide-scrollbar pb-2">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all',
              filter === option.value
                ? 'gradient-fire text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Goals list */}
      <div className="space-y-3">
        {filteredGoals.map((goal, index) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            index={index}
            onClick={() => setSelectedGoal(goal)}
          />
        ))}

        {filteredGoals.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum objetivo encontrado</p>
            <p className="text-sm">Adicione objetivos na aba "Ano"</p>
          </div>
        )}
      </div>

      {/* Goal detail modal */}
      <AnimatePresence>
        {selectedGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedGoal(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg card-dark rounded-t-3xl p-6 h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />

              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  {settings.showEmojis && selectedGoal.emoji && (
                    <span className="text-4xl">{selectedGoal.emoji}</span>
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{selectedGoal.name}</h2>
                    <p className="text-muted-foreground">{selectedGoal.period}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedGoal(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold border',
                      selectedGoal && typeColors[selectedGoal.type]
                    )}
                  >
                    {selectedGoal && typeLabels[selectedGoal.type]}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {selectedGoal.period}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-muted" />
                    Criado em {new Date(selectedGoal.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Progresso</span>
                    <span className="text-2xl font-bold text-gradient-fire">
                      {selectedGoal.progress}%
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 progress-bar">
                        <motion.div
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedGoal.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{selectedGoal.progress}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedGoal.progress}
                      onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/10 border border-border/30">
                    <p className="text-xs text-muted-foreground">Categoria</p>
                    <p className="font-semibold">{typeLabels[selectedGoal.type]}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/10 border border-border/30">
                    <p className="text-xs text-muted-foreground">Período</p>
                    <p className="font-semibold">{selectedGoal.period}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    removeGoal(selectedGoal.id);
                    setSelectedGoal(null);
                  }}
                  className="w-full py-3 border border-destructive text-destructive rounded-xl hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir objetivo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
