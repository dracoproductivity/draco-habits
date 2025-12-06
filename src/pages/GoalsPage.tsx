import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Trash2, ChevronDown, Link2, Plus, Calendar, Repeat, Target, Check, Bell, Lightbulb, Pencil } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { GoalCard } from '@/components/goals/GoalCard';
import { HabitDetailModal } from '@/components/daily/HabitDetailModal';
import { Goal, GoalType, GoalCategory, DEFAULT_CATEGORIES, XP_OPTIONS, CustomCategory, Habit } from '@/types';
import { cn } from '@/lib/utils';
import { startOfWeek, endOfWeek, addWeeks, format, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type FilterType = 'all' | 'habits' | Goal['type'];

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'habits', label: 'Hábitos' },
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

const parentTypeMap: Record<GoalType, GoalType | null> = {
  weekly: 'monthly',
  monthly: 'quarterly',
  quarterly: 'yearly',
  yearly: null,
};

const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const QUARTER_MONTHS: Record<number, string> = {
  1: 'Janeiro, Fevereiro, Março',
  2: 'Abril, Maio, Junho',
  3: 'Julho, Agosto, Setembro',
  4: 'Outubro, Novembro, Dezembro',
};

const QUARTER_MONTH_ARRAYS: Record<number, string[]> = {
  1: ['Janeiro', 'Fevereiro', 'Março'],
  2: ['Abril', 'Maio', 'Junho'],
  3: ['Julho', 'Agosto', 'Setembro'],
  4: ['Outubro', 'Novembro', 'Dezembro'],
};

// Generate period options - only current and future periods
const generateWeekOptions = (includeNextYear = false) => {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentWeek = Math.ceil(
    (now.getTime() - new Date(currentYear, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  
  // Current year weeks (from current week onwards)
  const yearStart = startOfYear(new Date(currentYear, 0, 1));
  for (let i = currentWeek; i <= 52; i++) {
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
      value: `Semana ${i} - ${currentYear}`, 
      label: `Semana ${i} - ${dateRange} (${currentYear})` 
    });
  }
  
  // Next year weeks (all 52)
  if (includeNextYear) {
    const nextYear = currentYear + 1;
    const nextYearStart = startOfYear(new Date(nextYear, 0, 1));
    for (let i = 1; i <= 52; i++) {
      const weekStart = startOfWeek(addWeeks(nextYearStart, i - 1), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(addWeeks(nextYearStart, i - 1), { weekStartsOn: 1 });
      
      const startDay = format(weekStart, 'd', { locale: ptBR });
      const endDay = format(weekEnd, 'd', { locale: ptBR });
      const startMonth = format(weekStart, 'MMMM', { locale: ptBR });
      const endMonth = format(weekEnd, 'MMMM', { locale: ptBR });
      
      const dateRange = startMonth === endMonth 
        ? `${startDay}-${endDay} de ${startMonth}`
        : `${startDay} de ${startMonth} - ${endDay} de ${endMonth}`;
      
      options.push({ 
        value: `Semana ${i} - ${nextYear}`, 
        label: `Semana ${i} - ${dateRange} (${nextYear})` 
      });
    }
  }
  
  return options;
};

const generateMonthOptions = (includeNextYear = false) => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  const options: { value: string; label: string }[] = [];
  
  // Current year months (from current month onwards)
  for (let i = currentMonth; i < 12; i++) {
    options.push({ value: `${months[i]} ${currentYear}`, label: `${months[i]} ${currentYear}` });
  }
  
  // Next year months
  if (includeNextYear) {
    const nextYear = currentYear + 1;
    months.forEach(m => {
      options.push({ value: `${m} ${nextYear}`, label: `${m} ${nextYear}` });
    });
  }
  
  return options;
};

const generateQuarterOptions = (includeNextYear = false) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
  
  const options: { value: string; label: string }[] = [];
  
  // Current year quarters (from current quarter onwards)
  const quarterLabels = ['Jan-Mar', 'Abr-Jun', 'Jul-Set', 'Out-Dez'];
  for (let q = currentQuarter; q <= 4; q++) {
    options.push({ 
      value: `${q}º Tri - ${currentYear}`, 
      label: `${q}º Tri - ${currentYear} (${quarterLabels[q - 1]})` 
    });
  }
  
  // Next year quarters
  if (includeNextYear) {
    const nextYear = currentYear + 1;
    for (let q = 1; q <= 4; q++) {
      options.push({ 
        value: `${q}º Tri - ${nextYear}`, 
        label: `${q}º Tri - ${nextYear} (${quarterLabels[q - 1]})` 
      });
    }
  }
  
  return options;
};

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return [
    { value: currentYear.toString(), label: currentYear.toString() },
    { value: (currentYear + 1).toString(), label: (currentYear + 1).toString() },
  ];
};

const getPeriodOptions = (type: GoalType) => {
  switch (type) {
    case 'weekly': return generateWeekOptions(true);
    case 'monthly': return generateMonthOptions(true);
    case 'quarterly': return generateQuarterOptions(true);
    case 'yearly': return generateYearOptions();
  }
};

export const GoalsPage = () => {
  const { goals, addGoal, updateGoal, removeGoal, settings, habits, customCategories, addCustomCategory, removeHabit, toggleHabitCheck, getHabitCheckForDate } = useAppStore();
  
  // Goals list state
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [editingType, setEditingType] = useState<GoalType | null>(null);
  const [showTypeChangeWarning, setShowTypeChangeWarning] = useState(false);
  const [pendingTypeChange, setPendingTypeChange] = useState<GoalType | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<string | null>(null);
  const [editingParent, setEditingParent] = useState<boolean>(false);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalType, setNewGoalType] = useState<GoalType>('weekly');
  const [newGoalPeriod, setNewGoalPeriod] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<GoalCategory | ''>('');
  const [newGoalCategoryXP, setNewGoalCategoryXP] = useState<number>(20);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('🎯');
  const [newCategoryXP, setNewCategoryXP] = useState<number>(20);
  const [newCategoryHasEmoji, setNewCategoryHasEmoji] = useState(true);
  
  // Edit category state
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryEmoji, setEditCategoryEmoji] = useState('');
  const [editCategoryHasEmoji, setEditCategoryHasEmoji] = useState(true);
  const [editCategoryXP, setEditCategoryXP] = useState<number>(20);
  
  // Weekly goal creation from parent
  const [showWeeklyGoalPrompt, setShowWeeklyGoalPrompt] = useState(false);
  const [weeklyGoalName, setWeeklyGoalName] = useState('');
  const [weeklyGoalDays, setWeeklyGoalDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [weeklyGoalRepeat, setWeeklyGoalRepeat] = useState(true);
  const [weeklyGoalPeriod, setWeeklyGoalPeriod] = useState('');
  const [parentGoalForWeekly, setParentGoalForWeekly] = useState<Goal | null>(null);
  
  // Check if user has no goals/habits (first time)
  const isFirstTimeUser = goals.length === 0 && habits.length === 0;

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

  const getLinkedHabits = (goalId: string) => {
    return habits.filter(h => h.goalId === goalId);
  };

  const filteredGoals = filter === 'all' || filter === 'habits'
    ? goals
    : goals.filter((g) => g.type === filter);

  const handleProgressChange = (value: number) => {
    if (selectedGoal) {
      updateGoal(selectedGoal.id, { progress: value });
      setSelectedGoal({ ...selectedGoal, progress: value });
    }
  };

  const handleTypeChangeRequest = (newType: GoalType) => {
    if (selectedGoal && newType !== selectedGoal.type) {
      setPendingTypeChange(newType);
      setShowTypeChangeWarning(true);
    } else {
      setEditingType(null);
    }
  };

  const confirmTypeChange = () => {
    if (selectedGoal && pendingTypeChange) {
      const periodOptions = getPeriodOptions(pendingTypeChange);
      const newPeriod = periodOptions[0]?.value || '';
      updateGoal(selectedGoal.id, { type: pendingTypeChange, period: newPeriod, parentGoalId: undefined });
      setSelectedGoal({ ...selectedGoal, type: pendingTypeChange, period: newPeriod, parentGoalId: undefined });
      setEditingType(null);
      setShowTypeChangeWarning(false);
      setPendingTypeChange(null);
    }
  };

  const cancelTypeChange = () => {
    setShowTypeChangeWarning(false);
    setPendingTypeChange(null);
  };

  const handlePeriodChange = (newPeriod: string) => {
    if (selectedGoal) {
      updateGoal(selectedGoal.id, { period: newPeriod });
      setSelectedGoal({ ...selectedGoal, period: newPeriod });
      setEditingPeriod(null);
    }
  };

  const handleCategoryChange = (category: GoalCategory) => {
    if (selectedGoal) {
      updateGoal(selectedGoal.id, { category });
      setSelectedGoal({ ...selectedGoal, category });
    }
  };

  const handleCategoryXPChange = (xp: number) => {
    if (selectedGoal) {
      updateGoal(selectedGoal.id, { categoryXP: xp });
      setSelectedGoal({ ...selectedGoal, categoryXP: xp });
    }
  };

  const handleAddGoalClick = () => {
    if (filter === 'all' || filter === 'habits') {
      setShowTypeSelector(true);
    } else {
      openNewGoalModal(filter as GoalType);
    }
  };

  const openNewGoalModal = (type: GoalType) => {
    setNewGoalType(type);
    setNewGoalPeriod(getPeriodOptions(type)[0]?.value || '');
    setNewGoalName('');
    setNewGoalCategory('');
    setNewGoalCategoryXP(20);
    setShowTypeSelector(false);
    setShowNewGoalModal(true);
  };

  const openEditCategoryModal = (category: CustomCategory) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setEditCategoryEmoji(category.emoji || '🎯');
    setEditCategoryHasEmoji(!!category.emoji);
    setEditCategoryXP(category.xpReward);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !editCategoryName.trim()) return;
    const { updateCustomCategory } = useAppStore.getState();
    updateCustomCategory(editingCategory.id, {
      name: editCategoryName.trim(),
      emoji: editCategoryHasEmoji ? editCategoryEmoji : undefined,
      xpReward: editCategoryXP,
    });
    setEditingCategory(null);
  };

  const handleCreateGoal = () => {
    if (!newGoalName.trim()) return;
    const newGoal = addGoal({
      name: newGoalName.trim(),
      type: newGoalType,
      period: newGoalPeriod,
      progress: 0,
      category: newGoalCategory || undefined,
      categoryXP: newGoalCategoryXP,
    });
    setShowNewGoalModal(false);
    setNewGoalName('');
    
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
    
    let parentId: string | undefined;
    if (parentGoalForWeekly.type === 'monthly') {
      parentId = parentGoalForWeekly.id;
    } else {
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

  const handleCreateCustomCategory = () => {
    if (!newCategoryName.trim()) return;
    addCustomCategory({
      name: newCategoryName.trim(),
      emoji: newCategoryHasEmoji ? newCategoryEmoji : undefined,
      xpReward: newCategoryXP,
    });
    setShowNewCategoryModal(false);
    setNewCategoryName('');
    setNewCategoryEmoji('🎯');
    setNewCategoryXP(20);
    setNewCategoryHasEmoji(true);
  };


  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...customCategories.map(c => ({ id: 'custom' as GoalCategory, name: c.name, emoji: c.emoji || '🎯', customId: c.id }))
  ];

  // Check for desktop/tablet
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen p-4 ${isDesktop ? 'pb-8 pt-6' : 'pb-20'}`}
    >
      <header className="mb-4">
        <h1 className={`font-bold text-gradient-primary ${isDesktop ? 'text-3xl' : 'text-2xl'}`}>Objetivos</h1>
        <p className="text-muted-foreground">Gerencie seus objetivos</p>
      </header>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto hide-scrollbar pb-2">
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

      {/* Content based on filter */}
      {filter === 'habits' ? (
        /* Habits List View - Same as Daily */
        <div className="space-y-2">
          {habits.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-primary/10 border border-primary/30 rounded-2xl"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl gradient-fire flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Nenhum hábito ainda!</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Vá até a aba <strong>Diário</strong> para criar seus primeiros hábitos. 
                    Cada hábito pode ser vinculado a objetivos de diferentes períodos.
                  </p>
                  <button
                    onClick={() => {
                      const { setActiveTab } = useAppStore.getState();
                      setActiveTab('daily');
                    }}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Ir para o Diário →
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            habits.map((habit, index) => {
              const todayStr = new Date().toISOString().split('T')[0];
              const check = getHabitCheckForDate(habit.id, todayStr);
              const isCompleted = check?.completed ?? false;
              const linkedGoal = goals.find(g => g.id === habit.goalId);

              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl transition-all group cursor-pointer',
                    isCompleted ? 'opacity-70' : 'hover:bg-muted/20'
                  )}
                  onClick={() => setSelectedHabit(habit)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleHabitCheck(habit.id, todayStr);
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
                        {habit.weekDays.map(d => weekDayLabels[d]).join(', ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {habit.notificationEnabled && (
                      <Bell className="w-3.5 h-3.5 text-primary" />
                    )}
                    <span className="text-xs text-muted-foreground">+{habit.xpReward} XP</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeHabit(habit.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      ) : (
        /* Goals list */
        <div className="space-y-3">
          {filteredGoals.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-primary/10 border border-primary/30 rounded-2xl mb-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl gradient-fire flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    {filter !== 'all' ? `Nenhum objetivo ${typeLabels[filter as GoalType].toLowerCase()}!` : 'Nenhum objetivo ainda!'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Clique no botão abaixo para criar seu primeiro objetivo 
                    {filter !== 'all' && ` ${typeLabels[filter as GoalType].toLowerCase()}`}.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {filteredGoals.map((goal, index) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              index={index}
              onClick={() => setSelectedGoal(goal)}
            />
          ))}
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddGoalClick}
            className="w-full py-4 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">
              Adicionar Objetivo{filter !== 'all' ? ` ${typeLabels[filter as GoalType]}` : ''}
            </span>
          </motion.button>
        </div>
      )}


      {/* Type Selector Modal */}
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
              className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
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

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Categoria</label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setNewGoalCategory(cat.id)}
                        className={cn(
                          'px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-1',
                          newGoalCategory === cat.id
                            ? 'gradient-fire text-primary-foreground'
                            : 'bg-muted/30 border border-border/50 hover:bg-muted/50'
                        )}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.name}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => setShowNewCategoryModal(true)}
                      className="px-3 py-2 rounded-xl text-sm bg-muted/30 border border-dashed border-border/50 hover:bg-muted/50 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Criar</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">XP por hábito concluído</label>
                  <div className="flex gap-2">
                    {XP_OPTIONS.map((xp) => (
                      <button
                        key={xp}
                        onClick={() => setNewGoalCategoryXP(xp)}
                        className={cn(
                          'flex-1 py-2 rounded-xl text-sm font-medium transition-all',
                          newGoalCategoryXP === xp
                            ? 'gradient-fire text-primary-foreground'
                            : 'bg-muted/30 border border-border/50 hover:bg-muted/50'
                        )}
                      >
                        {xp}
                      </button>
                    ))}
                  </div>
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

      {/* Create Category Modal */}
      <AnimatePresence>
        {showNewCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowNewCategoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Nova Categoria</h3>
                <button onClick={() => setShowNewCategoryModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Nome da categoria</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex: Finanças"
                    className="w-full p-3 rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-muted-foreground">Emoji</label>
                    <button
                      onClick={() => setNewCategoryHasEmoji(!newCategoryHasEmoji)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                        newCategoryHasEmoji
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted/30 text-muted-foreground'
                      )}
                    >
                      {newCategoryHasEmoji ? 'Com emoji' : 'Sem emoji'}
                    </button>
                  </div>
                  {newCategoryHasEmoji && (
                    <input
                      type="text"
                      value={newCategoryEmoji}
                      onChange={(e) => setNewCategoryEmoji(e.target.value.slice(-2))}
                      placeholder="🎯"
                      className="w-full p-3 rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:border-primary text-center text-2xl"
                    />
                  )}
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">XP por hábito</label>
                  <div className="flex gap-2">
                    {XP_OPTIONS.map((xp) => (
                      <button
                        key={xp}
                        onClick={() => setNewCategoryXP(xp)}
                        className={cn(
                          'flex-1 py-2 rounded-xl text-sm font-medium transition-all',
                          newCategoryXP === xp
                            ? 'gradient-fire text-primary-foreground'
                            : 'bg-muted/30 border border-border/50 hover:bg-muted/50'
                        )}
                      >
                        {xp}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreateCustomCategory}
                  disabled={!newCategoryName.trim()}
                  className="w-full py-3 gradient-fire text-primary-foreground rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Criar Categoria
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Category Modal */}
      <AnimatePresence>
        {editingCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setEditingCategory(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Editar Categoria</h3>
                <button onClick={() => setEditingCategory(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Nome da categoria</label>
                  <input
                    type="text"
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    placeholder="Ex: Finanças"
                    className="w-full p-3 rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-muted-foreground">Emoji</label>
                    <button
                      onClick={() => setEditCategoryHasEmoji(!editCategoryHasEmoji)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                        editCategoryHasEmoji
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted/30 text-muted-foreground'
                      )}
                    >
                      {editCategoryHasEmoji ? 'Com emoji' : 'Sem emoji'}
                    </button>
                  </div>
                  {editCategoryHasEmoji && (
                    <input
                      type="text"
                      value={editCategoryEmoji}
                      onChange={(e) => setEditCategoryEmoji(e.target.value.slice(-2))}
                      placeholder="🎯"
                      className="w-full p-3 rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:border-primary text-center text-2xl"
                    />
                  )}
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">XP por hábito</label>
                  <div className="flex gap-2">
                    {XP_OPTIONS.map((xp) => (
                      <button
                        key={xp}
                        onClick={() => setEditCategoryXP(xp)}
                        className={cn(
                          'flex-1 py-2 rounded-xl text-sm font-medium transition-all',
                          editCategoryXP === xp
                            ? 'gradient-fire text-primary-foreground'
                            : 'bg-muted/30 border border-border/50 hover:bg-muted/50'
                        )}
                      >
                        {xp}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const { removeCustomCategory } = useAppStore.getState();
                      removeCustomCategory(editingCategory.id);
                      setEditingCategory(null);
                    }}
                    className="flex-1 py-3 bg-destructive/10 text-destructive rounded-xl font-semibold hover:bg-destructive/20 transition-colors"
                  >
                    Excluir
                  </button>
                  <button
                    onClick={handleUpdateCategory}
                    disabled={!editCategoryName.trim()}
                    className="flex-1 py-3 gradient-fire text-primary-foreground rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Salvar
                  </button>
                </div>
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
                  Vinculado a: <span className="font-semibold text-foreground">{parentGoalForWeekly.name}</span>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Nome do hábito</label>
                  <input
                    type="text"
                    value={weeklyGoalName}
                    onChange={(e) => setWeeklyGoalName(e.target.value)}
                    placeholder="Ex: Ler 30 minutos"
                    className="w-full p-3 rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Dias da semana</label>
                  <div className="flex gap-1.5">
                    {weekDayLabels.map((label, index) => (
                      <button
                        key={index}
                        onClick={() => toggleWeekDay(index)}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-xs font-medium transition-all',
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Repetir toda semana</span>
                  </div>
                  <button
                    onClick={() => setWeeklyGoalRepeat(!weeklyGoalRepeat)}
                    className={cn(
                      'w-10 h-5 rounded-full transition-all relative',
                      weeklyGoalRepeat ? 'bg-primary' : 'bg-muted'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-all',
                        weeklyGoalRepeat ? 'right-0.5' : 'left-0.5'
                      )}
                    />
                  </button>
                </div>

                {!weeklyGoalRepeat && (
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Selecione a semana</label>
                    <select
                      value={weeklyGoalPeriod}
                      onChange={(e) => setWeeklyGoalPeriod(e.target.value)}
                      className="w-full p-3 rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:border-primary"
                    >
                      {generateWeekOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowWeeklyGoalPrompt(false)}
                    className="flex-1 py-3 bg-muted/50 text-foreground rounded-xl font-semibold hover:bg-muted/70 transition-colors"
                  >
                    Pular
                  </button>
                  <button
                    onClick={handleCreateWeeklyGoal}
                    disabled={!weeklyGoalName.trim()}
                    className="flex-1 py-3 gradient-fire text-primary-foreground rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Criar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Detail Modal */}
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
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  {settings.showEmojis && selectedGoal.emoji && (
                    <span className="text-2xl">{selectedGoal.emoji}</span>
                  )}
                  <h3 className="text-lg font-bold">{selectedGoal.name}</h3>
                </div>
                <button onClick={() => setSelectedGoal(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Progress */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Progresso</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 rounded-full bg-muted/50 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'var(--gradient-progress)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedGoal.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <span className="font-bold text-lg">{selectedGoal.progress}%</span>
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Tipo</label>
                  {editingType !== null ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {(['weekly', 'monthly', 'quarterly', 'yearly'] as GoalType[]).map((type) => (
                          <button
                            key={type}
                            onClick={() => handleTypeChangeRequest(type)}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                              selectedGoal.type === type ? typeColors[type] : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                            )}
                          >
                            {typeLabels[type]}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setEditingType(null)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={cn('px-3 py-1.5 rounded-full text-xs font-semibold', typeColors[selectedGoal.type])}>
                        {typeLabels[selectedGoal.type]}
                      </span>
                      <button
                        onClick={() => setEditingType(selectedGoal.type)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                      >
                        Trocar
                      </button>
                    </div>
                  )}
                </div>

                {/* Period */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Período</label>
                  {editingPeriod !== null ? (
                    <div className="space-y-2">
                      <select
                        value={selectedGoal.period}
                        onChange={(e) => handlePeriodChange(e.target.value)}
                        className="w-full p-3 rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:border-primary"
                      >
                        {getPeriodOptions(selectedGoal.type).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setEditingPeriod(null)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-2 rounded-xl bg-muted/30 border border-border/50 text-sm">
                        {selectedGoal.period}
                      </span>
                      <button
                        onClick={() => setEditingPeriod(selectedGoal.period)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                      >
                        Trocar
                      </button>
                    </div>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Categoria</label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat.id)}
                        className={cn(
                          'px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1',
                          selectedGoal.category === cat.id
                            ? 'gradient-fire text-primary-foreground'
                            : 'bg-muted/30 border border-border/50 hover:bg-muted/50'
                        )}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.name}</span>
                      </button>
                    ))}
                    {customCategories.map((cat) => (
                      <div key={cat.id} className="relative group">
                        <button
                          onClick={() => {
                            updateGoal(selectedGoal.id, { category: 'custom', customCategoryId: cat.id });
                            setSelectedGoal({ ...selectedGoal, category: 'custom', customCategoryId: cat.id });
                          }}
                          className={cn(
                            'px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1',
                            selectedGoal.category === 'custom' && selectedGoal.customCategoryId === cat.id
                              ? 'gradient-fire text-primary-foreground'
                              : 'bg-muted/30 border border-border/50 hover:bg-muted/50'
                          )}
                        >
                          {cat.emoji && <span>{cat.emoji}</span>}
                          <span>{cat.name}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditCategoryModal(cat);
                          }}
                          className="absolute -top-1 -right-1 p-1 rounded-full bg-muted/80 border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Pencil className="w-2.5 h-2.5 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setShowNewCategoryModal(true)}
                      className="px-3 py-2 rounded-xl text-xs bg-muted/30 border border-dashed border-border/50 hover:bg-muted/50 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Criar</span>
                    </button>
                  </div>
                </div>

                {/* XP per habit */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">XP por hábito concluído</label>
                  <div className="flex gap-2">
                    {XP_OPTIONS.map((xp) => (
                      <button
                        key={xp}
                        onClick={() => handleCategoryXPChange(xp)}
                        className={cn(
                          'flex-1 py-2 rounded-xl text-sm font-medium transition-all',
                          selectedGoal.categoryXP === xp
                            ? 'gradient-fire text-primary-foreground'
                            : 'bg-muted/30 border border-border/50 hover:bg-muted/50'
                        )}
                      >
                        {xp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Linked Habits */}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Hábitos vinculados</label>
                  {getLinkedHabits(selectedGoal.id).length > 0 ? (
                    <div className="space-y-2">
                      {getLinkedHabits(selectedGoal.id).map((habit) => (
                        <div key={habit.id} className="p-2 rounded-xl bg-muted/30 text-sm flex items-center gap-2">
                          {habit.emoji && <span>{habit.emoji}</span>}
                          <span>{habit.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum hábito vinculado</p>
                  )}
                </div>

                {/* Parent Goal */}
                {selectedGoal.type !== 'yearly' && (
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Objetivo pai</label>
                    {editingParent ? (
                      <div className="space-y-2">
                        {getParentGoalOptions(selectedGoal.type).map((goal) => (
                          <button
                            key={goal.id}
                            onClick={() => handleParentChange(goal.id)}
                            className={cn(
                              'w-full p-2 rounded-xl text-left text-sm transition-colors flex items-center gap-2',
                              selectedGoal.parentGoalId === goal.id ? 'bg-primary/20 border-primary/30' : 'bg-muted/30 hover:bg-muted/50'
                            )}
                          >
                            {goal.emoji && settings.showEmojis && <span>{goal.emoji}</span>}
                            <span>{goal.name}</span>
                          </button>
                        ))}
                        <button
                          onClick={() => handleParentChange(null)}
                          className="w-full p-2 rounded-xl text-left text-sm bg-muted/30 hover:bg-muted/50 transition-colors text-muted-foreground"
                        >
                          Sem objetivo pai
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingParent(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/50 text-sm hover:bg-muted/50 transition-colors"
                      >
                        {selectedGoal.parentGoalId ? (
                          <>
                            <Link2 className="w-4 h-4" />
                            <span>{getParentGoal(selectedGoal.parentGoalId)?.name}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Vincular a objetivo</span>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Delete */}
                <button
                  onClick={() => {
                    removeGoal(selectedGoal.id);
                    setSelectedGoal(null);
                  }}
                  className="w-full py-3 flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir objetivo</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Type Change Warning Modal */}
      <AnimatePresence>
        {showTypeChangeWarning && pendingTypeChange && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={cancelTypeChange}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="text-lg font-bold">Alterar tipo do objetivo</h3>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-sm text-muted-foreground">
                  Você está alterando de <span className={cn('font-semibold px-2 py-0.5 rounded-full', typeColors[selectedGoal?.type || 'weekly'])}>{typeLabels[selectedGoal?.type || 'weekly']}</span> para <span className={cn('font-semibold px-2 py-0.5 rounded-full', typeColors[pendingTypeChange])}>{typeLabels[pendingTypeChange]}</span>.
                </p>
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive font-medium mb-1">⚠️ Atenção</p>
                  <p className="text-xs text-muted-foreground">
                    Ao alterar o tipo, você precisará reorganizar os objetivos vinculados na linha do tempo (semanal → mensal → trimestral → anual) para manter a consistência do progresso em porcentagem.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Os vínculos com objetivos pai serão removidos e você precisará reconfigurar manualmente.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={cancelTypeChange}
                  className="flex-1 py-3 bg-muted/50 text-foreground rounded-xl font-semibold hover:bg-muted/70 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmTypeChange}
                  className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-xl font-semibold hover:bg-destructive/90 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Habit Detail Modal */}
      {selectedHabit && (
        <HabitDetailModal
          habit={selectedHabit}
          isOpen={!!selectedHabit}
          onClose={() => setSelectedHabit(null)}
        />
      )}
    </motion.div>
  );
};
