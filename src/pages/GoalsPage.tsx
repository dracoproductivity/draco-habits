import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Trash2, ChevronDown, Link2, Plus, Calendar, Repeat } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { GoalCard } from '@/components/goals/GoalCard';
import { Goal, GoalType } from '@/types';
import { cn } from '@/lib/utils';
import { startOfWeek, endOfWeek, addWeeks, format, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

// Hierarchy: weekly → monthly → quarterly → yearly
const parentTypeMap: Record<GoalType, GoalType | null> = {
  weekly: 'monthly',
  monthly: 'quarterly',
  quarterly: 'yearly',
  yearly: null,
};

const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const generateWeekOptions = () => {
  const options: { value: string; label: string }[] = [];
  const year = new Date().getFullYear();
  const yearStart = startOfYear(new Date(year, 0, 1));
  
  for (let i = 1; i <= 52; i++) {
    const weekStart = startOfWeek(addWeeks(yearStart, i - 1), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(addWeeks(yearStart, i - 1), { weekStartsOn: 1 });
    
    const startDay = format(weekStart, 'd', { locale: ptBR });
    const endDay = format(weekEnd, 'd', { locale: ptBR });
    const startMonth = format(weekStart, 'MMMM', { locale: ptBR });
    const endMonth = format(weekEnd, 'MMMM', { locale: ptBR });
    
    const dateRange = startMonth === endMonth 
      ? `${startDay}-${endDay} de ${startMonth}`
      : `${startDay} de ${startMonth} - ${endDay} de ${endMonth}`;
    
    options.push({ 
      value: `Semana ${i}`, 
      label: `Semana ${i} - ${dateRange}` 
    });
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
    { value: `1º Tri - ${year}`, label: `1º Tri - ${year} (Jan-Mar)` },
    { value: `2º Tri - ${year}`, label: `2º Tri - ${year} (Abr-Jun)` },
    { value: `3º Tri - ${year}`, label: `3º Tri - ${year} (Jul-Set)` },
    { value: `4º Tri - ${year}`, label: `4º Tri - ${year} (Out-Dez)` },
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
  const { goals, addGoal, updateGoal, removeGoal, settings } = useAppStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [editingType, setEditingType] = useState<GoalType | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<string | null>(null);
  const [editingParent, setEditingParent] = useState<boolean>(false);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalType, setNewGoalType] = useState<GoalType>('weekly');
  const [newGoalPeriod, setNewGoalPeriod] = useState('');
  
  // Weekly goal creation from parent
  const [showWeeklyGoalPrompt, setShowWeeklyGoalPrompt] = useState(false);
  const [weeklyGoalName, setWeeklyGoalName] = useState('');
  const [weeklyGoalDays, setWeeklyGoalDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [weeklyGoalRepeat, setWeeklyGoalRepeat] = useState(true);
  const [weeklyGoalPeriod, setWeeklyGoalPeriod] = useState('');
  const [parentGoalForWeekly, setParentGoalForWeekly] = useState<Goal | null>(null);

  // Get potential parent goals for a given goal type
  const getParentGoalOptions = (type: GoalType): Goal[] => {
    const parentType = parentTypeMap[type];
    if (!parentType) return [];
    return goals.filter(g => g.type === parentType);
  };

  const handleParentChange = (parentId: string | null) => {
    if (selectedGoal) {
      updateGoal(selectedGoal.id, { parentGoalId: parentId || undefined });
      setSelectedGoal({ ...selectedGoal, parentGoalId: parentId || undefined });
      setEditingParent(false);
    }
  };

  const getParentGoal = (parentId?: string): Goal | undefined => {
    if (!parentId) return undefined;
    return goals.find(g => g.id === parentId);
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

  const handleAddGoalClick = () => {
    if (filter === 'all') {
      setShowTypeSelector(true);
    } else {
      openNewGoalModal(filter as GoalType);
    }
  };

  const openNewGoalModal = (type: GoalType) => {
    setNewGoalType(type);
    setNewGoalPeriod(getPeriodOptions(type)[0]?.value || '');
    setNewGoalName('');
    setShowTypeSelector(false);
    setShowNewGoalModal(true);
  };

  const handleCreateGoal = () => {
    if (!newGoalName.trim()) return;
    const newGoal = addGoal({
      name: newGoalName.trim(),
      type: newGoalType,
      period: newGoalPeriod,
      progress: 0,
    });
    setShowNewGoalModal(false);
    setNewGoalName('');
    
    // Show weekly goal prompt for non-weekly goals
    if (newGoalType !== 'weekly' && newGoal) {
      setParentGoalForWeekly(newGoal);
      setWeeklyGoalName('');
      setWeeklyGoalDays([1, 2, 3, 4, 5]);
      setWeeklyGoalRepeat(true);
      setWeeklyGoalPeriod(generateWeekOptions()[0]?.value || '');
      setShowWeeklyGoalPrompt(true);
    }
  };

  const handleCreateWeeklyGoal = () => {
    if (!weeklyGoalName.trim() || !parentGoalForWeekly) return;
    
    // Find the monthly goal to link to (need to traverse hierarchy)
    let parentId: string | undefined;
    if (parentGoalForWeekly.type === 'monthly') {
      parentId = parentGoalForWeekly.id;
    } else {
      // For quarterly/yearly, try to find a monthly goal linked to it
      const monthlyGoals = goals.filter(g => g.type === 'monthly' && g.parentGoalId === parentGoalForWeekly.id);
      if (monthlyGoals.length > 0) {
        parentId = monthlyGoals[0].id;
      }
    }
    
    addGoal({
      name: weeklyGoalName.trim(),
      type: 'weekly',
      period: weeklyGoalPeriod,
      progress: 0,
      parentGoalId: parentId,
      weekDays: weeklyGoalDays,
      repeatWeekly: weeklyGoalRepeat,
    });
    
    setShowWeeklyGoalPrompt(false);
    setParentGoalForWeekly(null);
  };

  const toggleWeekDay = (day: number) => {
    if (weeklyGoalDays.includes(day)) {
      setWeeklyGoalDays(weeklyGoalDays.filter(d => d !== day));
    } else {
      setWeeklyGoalDays([...weeklyGoalDays, day].sort());
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
        {filteredGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">Nenhum objetivo encontrado</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddGoalClick}
              className="px-6 py-3 rounded-xl gradient-fire text-primary-foreground font-semibold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Adicionar Objetivo
            </motion.button>
          </div>
        ) : (
          <>
            {filteredGoals.map((goal, index) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={index}
                onClick={() => setSelectedGoal(goal)}
              />
            ))}
            
            {/* Add button below list */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddGoalClick}
              className="w-full py-4 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Adicionar Objetivo</span>
            </motion.button>
          </>
        )}
      </div>

      {/* Type Selector Modal (when filter is 'all') */}
      <AnimatePresence>
        {showTypeSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowTypeSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-xl"
            >
              <h3 className="text-lg font-bold mb-4 text-center">Escolha o tipo de objetivo</h3>
              <div className="space-y-2">
                {(['weekly', 'monthly', 'quarterly', 'yearly'] as GoalType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => openNewGoalModal(type)}
                    className={cn(
                      'w-full p-3 rounded-xl text-left transition-colors flex items-center gap-3',
                      'hover:bg-muted/50 border border-border/50'
                    )}
                  >
                    <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', typeColors[type])}>
                      {typeLabels[type]}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Goal Modal */}
      <AnimatePresence>
        {showNewGoalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowNewGoalModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Novo Objetivo</h3>
                <button onClick={() => setShowNewGoalModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Nome do objetivo</label>
                  <input
                    type="text"
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    placeholder="Ex: Ler 12 livros"
                    className="w-full p-3 rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Tipo</label>
                  <div className={cn('px-3 py-2 rounded-full text-xs font-semibold inline-block', typeColors[newGoalType])}>
                    {typeLabels[newGoalType]}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Período</label>
                  <select
                    value={newGoalPeriod}
                    onChange={(e) => setNewGoalPeriod(e.target.value)}
                    className="w-full p-3 rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:border-primary"
                  >
                    {getPeriodOptions(newGoalType).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCreateGoal}
                  disabled={!newGoalName.trim()}
                  className="w-full py-3 gradient-fire text-primary-foreground rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Criar Objetivo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly Goal Prompt Modal */}
      <AnimatePresence>
        {showWeeklyGoalPrompt && parentGoalForWeekly && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowWeeklyGoalPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Criar Hábito Semanal</h3>
                <button onClick={() => setShowWeeklyGoalPrompt(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 mb-4">
                <p className="text-sm text-muted-foreground">
                  💡 Crie um hábito semanal vinculado ao objetivo "{parentGoalForWeekly.name}" para acompanhar seu progresso de forma mais granular.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Nome do hábito</label>
                  <input
                    type="text"
                    value={weeklyGoalName}
                    onChange={(e) => setWeeklyGoalName(e.target.value)}
                    placeholder="Ex: Ler 30 minutos por dia"
                    className="w-full p-3 rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Dias da semana
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {weekDayLabels.map((label, index) => (
                      <button
                        key={index}
                        onClick={() => toggleWeekDay(index)}
                        className={cn(
                          'w-10 h-10 rounded-full text-sm font-medium transition-all',
                          weeklyGoalDays.includes(index)
                            ? 'gradient-fire text-primary-foreground'
                            : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                    <Repeat className="w-4 h-4" />
                    Repetição
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWeeklyGoalRepeat(true)}
                      className={cn(
                        'flex-1 p-3 rounded-xl text-sm font-medium transition-all border',
                        weeklyGoalRepeat
                          ? 'gradient-fire text-primary-foreground border-transparent'
                          : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50'
                      )}
                    >
                      Toda semana
                    </button>
                    <button
                      onClick={() => setWeeklyGoalRepeat(false)}
                      className={cn(
                        'flex-1 p-3 rounded-xl text-sm font-medium transition-all border',
                        !weeklyGoalRepeat
                          ? 'gradient-fire text-primary-foreground border-transparent'
                          : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50'
                      )}
                    >
                      Apenas uma semana
                    </button>
                  </div>
                </div>

                {!weeklyGoalRepeat && (
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Selecione a semana</label>
                    <select
                      value={weeklyGoalPeriod}
                      onChange={(e) => setWeeklyGoalPeriod(e.target.value)}
                      className="w-full p-3 rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:border-primary text-sm"
                    >
                      {generateWeekOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowWeeklyGoalPrompt(false)}
                    className="flex-1 py-3 border border-border text-muted-foreground rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    Pular
                  </button>
                  <button
                    onClick={handleCreateWeeklyGoal}
                    disabled={!weeklyGoalName.trim() || weeklyGoalDays.length === 0}
                    className="flex-1 py-3 gradient-fire text-primary-foreground rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Criar Hábito
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

                {/* Week days display for weekly goals */}
                {selectedGoal.type === 'weekly' && selectedGoal.weekDays && (
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Dias da semana</label>
                    <div className="flex gap-2 flex-wrap">
                      {weekDayLabels.map((label, index) => (
                        <span
                          key={index}
                          className={cn(
                            'w-10 h-10 rounded-full text-sm font-medium flex items-center justify-center',
                            selectedGoal.weekDays?.includes(index)
                              ? 'gradient-fire text-primary-foreground'
                              : 'bg-muted/20 text-muted-foreground/50'
                          )}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                    {selectedGoal.repeatWeekly !== undefined && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {selectedGoal.repeatWeekly ? '🔄 Repete toda semana' : '📅 Apenas esta semana'}
                      </p>
                    )}
                  </div>
                )}

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

                {/* Parent Goal selector */}
                {parentTypeMap[selectedGoal.type] && (
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                      <Link2 className="w-4 h-4" />
                      Vincular a objetivo {typeLabels[parentTypeMap[selectedGoal.type]!]}
                    </label>
                    <div className="relative">
                      <button
                        onClick={() => setEditingParent(!editingParent)}
                        className="w-full p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between"
                      >
                        <span className="font-medium">
                          {selectedGoal.parentGoalId 
                            ? (getParentGoal(selectedGoal.parentGoalId)?.name || 'Objetivo removido')
                            : 'Nenhum (independente)'}
                        </span>
                        <ChevronDown className={cn('w-4 h-4 transition-transform', editingParent && 'rotate-180')} />
                      </button>
                      <AnimatePresence>
                        {editingParent && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl p-2 z-10 shadow-lg max-h-48 overflow-y-auto"
                          >
                            <button
                              onClick={() => handleParentChange(null)}
                              className={cn(
                                'w-full p-2 rounded-lg text-left hover:bg-muted/50 transition-colors text-sm',
                                !selectedGoal.parentGoalId && 'bg-muted/30'
                              )}
                            >
                              Nenhum (independente)
                            </button>
                            {getParentGoalOptions(selectedGoal.type).map((goal) => (
                              <button
                                key={goal.id}
                                onClick={() => handleParentChange(goal.id)}
                                className={cn(
                                  'w-full p-2 rounded-lg text-left hover:bg-muted/50 transition-colors text-sm flex items-center gap-2',
                                  selectedGoal.parentGoalId === goal.id && 'bg-muted/30'
                                )}
                              >
                                {settings.showEmojis && goal.emoji && <span>{goal.emoji}</span>}
                                <span>{goal.name}</span>
                                <span className="text-xs text-muted-foreground ml-auto">{goal.progress}%</span>
                              </button>
                            ))}
                            {getParentGoalOptions(selectedGoal.type).length === 0 && (
                              <p className="p-2 text-sm text-muted-foreground text-center">
                                Nenhum objetivo {typeLabels[parentTypeMap[selectedGoal.type]!].toLowerCase()} disponível
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Vincule este objetivo a um objetivo de nível superior para acompanhar o progresso em cascata.
                    </p>
                  </div>
                )}

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
