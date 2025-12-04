import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Trash2, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { GoalCard } from '@/components/goals/GoalCard';
import { Goal, GoalType } from '@/types';
import { cn } from '@/lib/utils';

type FilterType = 'all' | Goal['type'];

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
];

const typeLabels: Record<GoalType, string> = {
  weekly: 'Semanal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

const typeColors: Record<GoalType, string> = {
  weekly: 'bg-success/10 text-success border border-success/30',
  monthly: 'bg-primary/10 text-primary border border-primary/30',
  quarterly: 'bg-secondary/10 text-secondary border border-secondary/30',
  yearly: 'gradient-fire text-primary-foreground',
};

const generateWeekOptions = () => {
  const options: { value: string; label: string }[] = [];
  const year = new Date().getFullYear();
  for (let i = 1; i <= 52; i++) {
    options.push({ value: `Semana ${i}`, label: `Semana ${i}` });
  }
  return options;
};

const generateMonthOptions = () => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const year = new Date().getFullYear();
  return months.map(m => ({ value: `${m} ${year}`, label: `${m} ${year}` }));
};

const generateQuarterOptions = () => {
  const year = new Date().getFullYear();
  return [
    { value: `Q1-${year}`, label: `T1 ${year} (Jan-Mar)` },
    { value: `Q2-${year}`, label: `T2 ${year} (Abr-Jun)` },
    { value: `Q3-${year}`, label: `T3 ${year} (Jul-Set)` },
    { value: `Q4-${year}`, label: `T4 ${year} (Out-Dez)` },
  ];
};

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return [
    { value: (currentYear - 1).toString(), label: (currentYear - 1).toString() },
    { value: currentYear.toString(), label: currentYear.toString() },
    { value: (currentYear + 1).toString(), label: (currentYear + 1).toString() },
  ];
};

const getPeriodOptions = (type: GoalType) => {
  switch (type) {
    case 'weekly': return generateWeekOptions();
    case 'monthly': return generateMonthOptions();
    case 'quarterly': return generateQuarterOptions();
    case 'yearly': return generateYearOptions();
  }
};

export const GoalsPage = () => {
  const { goals, updateGoal, removeGoal, settings } = useAppStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [editingType, setEditingType] = useState<GoalType | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<string | null>(null);

  const filteredGoals = filter === 'all'
    ? goals
    : goals.filter((g) => g.type === filter);

  const handleProgressChange = (value: number) => {
    if (selectedGoal) {
      updateGoal(selectedGoal.id, { progress: value });
      setSelectedGoal({ ...selectedGoal, progress: value });
    }
  };

  const handleTypeChange = (newType: GoalType) => {
    if (selectedGoal) {
      const periodOptions = getPeriodOptions(newType);
      const newPeriod = periodOptions[0]?.value || '';
      updateGoal(selectedGoal.id, { type: newType, period: newPeriod });
      setSelectedGoal({ ...selectedGoal, type: newType, period: newPeriod });
      setEditingType(null);
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    if (selectedGoal) {
      updateGoal(selectedGoal.id, { period: newPeriod });
      setSelectedGoal({ ...selectedGoal, period: newPeriod });
      setEditingPeriod(null);
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
            className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedGoal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            >
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
                {/* Progress section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">Progresso</span>
                    <span className="text-2xl font-bold text-gradient-fire">
                      {selectedGoal.progress}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedGoal.progress}
                    onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                    className="w-full accent-primary h-2"
                  />
                </div>

                {/* Type selector */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Tipo</label>
                  <div className="relative">
                    <button
                      onClick={() => setEditingType(editingType ? null : selectedGoal.type)}
                      className="w-full p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between"
                    >
                      <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', typeColors[selectedGoal.type])}>
                        {typeLabels[selectedGoal.type]}
                      </span>
                      <ChevronDown className={cn('w-4 h-4 transition-transform', editingType && 'rotate-180')} />
                    </button>
                    <AnimatePresence>
                      {editingType && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl p-2 z-10 shadow-lg"
                        >
                          {(['weekly', 'monthly', 'quarterly', 'yearly'] as GoalType[]).map((type) => (
                            <button
                              key={type}
                              onClick={() => handleTypeChange(type)}
                              className={cn(
                                'w-full p-2 rounded-lg text-left hover:bg-muted/50 transition-colors',
                                selectedGoal.type === type && 'bg-muted/30'
                              )}
                            >
                              <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', typeColors[type])}>
                                {typeLabels[type]}
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Period selector */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Período</label>
                  <div className="relative">
                    <button
                      onClick={() => setEditingPeriod(editingPeriod ? null : selectedGoal.period)}
                      className="w-full p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between"
                    >
                      <span className="font-medium">{selectedGoal.period}</span>
                      <ChevronDown className={cn('w-4 h-4 transition-transform', editingPeriod && 'rotate-180')} />
                    </button>
                    <AnimatePresence>
                      {editingPeriod && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl p-2 z-10 shadow-lg max-h-48 overflow-y-auto"
                        >
                          {getPeriodOptions(selectedGoal.type).map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handlePeriodChange(option.value)}
                              className={cn(
                                'w-full p-2 rounded-lg text-left hover:bg-muted/50 transition-colors text-sm',
                                selectedGoal.period === option.value && 'bg-muted/30'
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Meta info */}
                <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                  <p className="text-xs text-muted-foreground">
                    Criado em {new Date(selectedGoal.createdAt).toLocaleDateString('pt-BR')}
                  </p>
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
