import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Check, Plus, X, ChevronLeft, ChevronRight, Bell, Target, Calendar, ChevronDown, Pencil } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { GoalType, Habit, GoalCategory, DEFAULT_CATEGORIES, XP_OPTIONS, CustomCategory } from '@/types';
import { HabitDetailModal } from './HabitDetailModal';
import { startOfWeek, endOfWeek, addWeeks, format, startOfYear, getDaysInMonth, startOfQuarter, endOfQuarter, differenceInDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { isHabitScheduledForDate, calculateHabitProgress } from '@/utils/habitInstanceCalculator';

const WEEK_DAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

// Calculate total days for a period
const calculateTotalDaysForPeriod = (type: GoalType, period: string): number => {
  const now = new Date();
  
  switch (type) {
    case 'yearly': {
      const year = parseInt(period);
      const startOfPeriod = new Date(year, 0, 1);
      const endOfPeriod = new Date(year, 11, 31);
      
      // If it's the current year, count from today
      if (year === now.getFullYear()) {
        return Math.max(1, differenceInDays(endOfPeriod, now) + 1);
      }
      return differenceInDays(endOfPeriod, startOfPeriod) + 1;
    }
    case 'quarterly': {
      // Format: "1º Tri - 2025"
      const match = period.match(/(\d+)º Tri - (\d+)/);
      if (!match) return 90;
      const quarter = parseInt(match[1]);
      const year = parseInt(match[2]);
      const quarterStart = startOfQuarter(new Date(year, (quarter - 1) * 3, 1));
      const quarterEnd = endOfQuarter(quarterStart);
      
      // If it's the current quarter, count from today
      if (year === now.getFullYear() && quarter === Math.ceil((now.getMonth() + 1) / 3)) {
        return Math.max(1, differenceInDays(quarterEnd, now) + 1);
      }
      return differenceInDays(quarterEnd, quarterStart) + 1;
    }
    case 'monthly': {
      // Format: "Janeiro 2025"
      const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const parts = period.split(' ');
      const monthIndex = months.indexOf(parts[0]);
      const year = parseInt(parts[1]);
      
      if (monthIndex === -1) return 30;
      
      const monthStart = startOfMonth(new Date(year, monthIndex, 1));
      const monthEnd = endOfMonth(monthStart);
      
      // If it's the current month, count from today
      if (year === now.getFullYear() && monthIndex === now.getMonth()) {
        return Math.max(1, differenceInDays(monthEnd, now) + 1);
      }
      return getDaysInMonth(new Date(year, monthIndex, 1));
    }
    case 'weekly': {
      return 7;
    }
  }
};

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
      // Parse week period "Semana X - YYYY"
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

// Period generation functions
const generateWeekOptions = (filterYear?: number, filterMonth?: number) => {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentWeek = Math.ceil(
    (now.getTime() - new Date(currentYear, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  
  const yearsToGenerate = filterYear ? [filterYear] : [currentYear, currentYear + 1];
  
  yearsToGenerate.forEach(year => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const startWeek = year === currentYear ? currentWeek : 1;
    
    for (let i = startWeek; i <= 52; i++) {
      const weekStart = startOfWeek(addWeeks(yearStart, i - 1), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(addWeeks(yearStart, i - 1), { weekStartsOn: 1 });
      
      // Filter by month if specified
      if (filterMonth !== undefined) {
        if (weekStart.getMonth() !== filterMonth && weekEnd.getMonth() !== filterMonth) {
          continue;
        }
      }
      
      const startDay = format(weekStart, 'd', { locale: ptBR });
      const endDay = format(weekEnd, 'd', { locale: ptBR });
      const startMonth = format(weekStart, 'MMMM', { locale: ptBR });
      const endMonth = format(weekEnd, 'MMMM', { locale: ptBR });
      
      const dateRange = startMonth === endMonth 
        ? `${startDay}-${endDay} de ${startMonth}`
        : `${startDay} de ${startMonth} - ${endDay} de ${endMonth}`;
      
      options.push({ 
        value: `Semana ${i} - ${year}`, 
        label: `Semana ${i} - ${dateRange} (${year})` 
      });
    }
  });
  
  return options;
};

const generateMonthOptions = (filterYear?: number, filterQuarter?: number) => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  const options: { value: string; label: string }[] = [];
  
  const yearsToGenerate = filterYear ? [filterYear] : [currentYear, currentYear + 1];
  
  yearsToGenerate.forEach(year => {
    const startMonth = year === currentYear ? currentMonth : 0;
    
    for (let i = startMonth; i < 12; i++) {
      // Filter by quarter if specified
      if (filterQuarter !== undefined) {
        const monthQuarter = Math.ceil((i + 1) / 3);
        if (monthQuarter !== filterQuarter) continue;
      }
      
      options.push({ value: `${months[i]} ${year}`, label: `${months[i]} ${year}` });
    }
  });
  
  return options;
};

const generateQuarterOptions = (filterYear?: number) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
  
  const options: { value: string; label: string }[] = [];
  const quarterLabels = ['Jan-Mar', 'Abr-Jun', 'Jul-Set', 'Out-Dez'];
  
  const yearsToGenerate = filterYear ? [filterYear] : [currentYear, currentYear + 1];
  
  yearsToGenerate.forEach(year => {
    const startQ = year === currentYear ? currentQuarter : 1;
    
    for (let q = startQ; q <= 4; q++) {
      options.push({ 
        value: `${q}º Tri - ${year}`, 
        label: `${q}º Tri - ${year} (${quarterLabels[q - 1]})` 
      });
    }
  });
  
  return options;
};

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return [
    { value: currentYear.toString(), label: currentYear.toString() },
    { value: (currentYear + 1).toString(), label: (currentYear + 1).toString() },
  ];
};

const getPeriodOptions = (type: GoalType, filterYear?: number, filterQuarter?: number, filterMonth?: number) => {
  switch (type) {
    case 'weekly': return generateWeekOptions(filterYear, filterMonth);
    case 'monthly': return generateMonthOptions(filterYear, filterQuarter);
    case 'quarterly': return generateQuarterOptions(filterYear);
    case 'yearly': return generateYearOptions();
  }
};

interface GoalCreationData {
  name: string;
  periods: string[]; // Changed to array for multi-select
}

type CreationMode = 'single' | 'hierarchical';

const CircularProgress = ({ value, label, delay = 0 }: { value: number; label: string; delay?: number }) => {
  const circumference = 2 * Math.PI * 32;
  const offset = circumference - (value / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="flex flex-col items-center"
    >
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="hsl(var(--muted) / 0.3)"
            strokeWidth="4"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.1 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">{value}%</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </motion.div>
  );
};

const LinearProgress = ({ value, label, delay = 0 }: { value: number; label: string; delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex flex-col gap-1.5 min-w-[100px]"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-bold text-foreground">{value}%</span>
      </div>
      <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--gradient-progress)' }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.1 }}
        />
      </div>
    </motion.div>
  );
};

export const HabitList = () => {
  const { 
    habits, 
    goals, 
    settings, 
    addHabit, 
    removeHabit, 
    toggleHabitCheck, 
    getHabitCheckForDate,
    addGoal,
    updateHabit,
    getDailyProgress,
    getWeeklyProgress,
    customCategories,
    addCustomCategory,
    updateCustomCategory,
  } = useAppStore();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showGoalCreation, setShowGoalCreation] = useState(false);
  const [creationMode, setCreationMode] = useState<CreationMode>('single');
  const [singleGoalType, setSingleGoalType] = useState<GoalType | ''>('');
  const [singleGoalPeriod, setSingleGoalPeriod] = useState('');
  const [singleGoalName, setSingleGoalName] = useState('');
  
  // Category and XP selection for goal creation
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | string>('');
  const [selectedCategoryXP, setSelectedCategoryXP] = useState<number>(20);
  const [showCategoryStep, setShowCategoryStep] = useState(false);
  
  // Custom category creation/edit state
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('🎯');
  const [newCategoryXP, setNewCategoryXP] = useState<number>(20);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  
  // Hierarchical creation state
  const [goalCreationStep, setGoalCreationStep] = useState<GoalType>('yearly');
  const [newGoalName, setNewGoalName] = useState('');
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isOneTimeHabit, setIsOneTimeHabit] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<1 | 2 | 3 | 4>(1);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  
  // Multi-select periods for hierarchical creation
  const [goalCreationData, setGoalCreationData] = useState<Record<GoalType, GoalCreationData>>({
    yearly: { name: '', periods: [] },
    quarterly: { name: '', periods: [] },
    monthly: { name: '', periods: [] },
    weekly: { name: '', periods: [] },
  });
  
  const [viewDate, setViewDate] = useState(new Date());
  const viewDateStr = viewDate.toISOString().split('T')[0];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const isToday = viewDateStr === todayStr;

  const getWeekStart = () => {
    const d = new Date(today);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

  const dailyProgress = getDailyProgress(todayStr);
  const weeklyProgress = getWeeklyProgress(getWeekStart());

  const navigateDay = (direction: number) => {
    const newDate = new Date(viewDate);
    newDate.setDate(newDate.getDate() + direction);
    setViewDate(newDate);
  };

  const handleDrag = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      if (info.offset.x > 0) {
        navigateDay(-1);
      } else {
        navigateDay(1);
      }
    }
  };

  const formatViewDate = () => {
    if (isToday) return 'Hoje';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (viewDateStr === yesterday.toISOString().split('T')[0]) return 'Ontem';
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (viewDateStr === tomorrow.toISOString().split('T')[0]) return 'Amanhã';
    return viewDate.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const toggleWeekDay = (day: number) => {
    if (isOneTimeHabit) return;
    setSelectedWeekDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const handleAddHabit = () => {
    if (!newHabitName.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite um nome para o hábito',
        variant: 'destructive',
      });
      return;
    }

    addHabit({
      name: newHabitName.trim(),
      emoji: newHabitEmoji || undefined,
      xpReward: 20,
      goalId: selectedGoalId || undefined,
      weekDays: isOneTimeHabit ? undefined : selectedWeekDays,
      isOneTime: isOneTimeHabit,
      repeatFrequency: isOneTimeHabit ? undefined : repeatFrequency,
    });
    setNewHabitName('');
    setNewHabitEmoji('');
    setSelectedGoalId(null);
    setSelectedWeekDays([1, 2, 3, 4, 5]);
    setIsOneTimeHabit(false);
    setRepeatFrequency(1);
    setShowAddForm(false);
    toast({
      title: 'Hábito adicionado!',
      description: `"${newHabitName}" foi adicionado à sua lista`,
    });
  };

  // Single goal creation - show category step
  const handleSingleGoalProceedToCategory = () => {
    if (!singleGoalName.trim()) {
      toast({ title: 'Erro', description: 'Digite um nome para o objetivo', variant: 'destructive' });
      return;
    }
    if (!singleGoalType) {
      toast({ title: 'Erro', description: 'Selecione um tipo de período', variant: 'destructive' });
      return;
    }
    if (!singleGoalPeriod) {
      toast({ title: 'Erro', description: 'Selecione um período', variant: 'destructive' });
      return;
    }
    setShowCategoryStep(true);
  };

  const handleCreateSingleGoal = () => {
    const totalDays = calculateTotalDaysForPeriod(singleGoalType as GoalType, singleGoalPeriod);
    
    const newGoal = addGoal({
      name: singleGoalName.trim(),
      emoji: newHabitEmoji || undefined,
      type: singleGoalType as GoalType,
      period: singleGoalPeriod,
      progress: 0,
      category: selectedCategory as GoalCategory || undefined,
      categoryXP: selectedCategoryXP,
    });
    
    setSelectedGoalId(newGoal.id);
    resetGoalCreation();
    toast({ 
      title: 'Objetivo criado!', 
      description: `Objetivo "${singleGoalName}" com ${totalDays} dias criado` 
    });
  };

  // Hierarchical goal creation helpers
  const getFilteredOptions = (type: GoalType) => {
    const yearlyPeriods = goalCreationData.yearly.periods;
    const quarterlyPeriods = goalCreationData.quarterly.periods;
    const monthlyPeriods = goalCreationData.monthly.periods;
    
    switch (type) {
      case 'yearly':
        return getPeriodOptions('yearly');
      case 'quarterly': {
        if (yearlyPeriods.length === 1) {
          return getPeriodOptions('quarterly', parseInt(yearlyPeriods[0]));
        }
        return getPeriodOptions('quarterly');
      }
      case 'monthly': {
        if (quarterlyPeriods.length === 1) {
          const match = quarterlyPeriods[0].match(/(\d+)º Tri - (\d+)/);
          if (match) {
            return getPeriodOptions('monthly', parseInt(match[2]), parseInt(match[1]));
          }
        }
        if (yearlyPeriods.length === 1) {
          return getPeriodOptions('monthly', parseInt(yearlyPeriods[0]));
        }
        return getPeriodOptions('monthly');
      }
      case 'weekly': {
        if (monthlyPeriods.length === 1) {
          const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                         'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
          const parts = monthlyPeriods[0].split(' ');
          const monthIndex = months.indexOf(parts[0]);
          const year = parseInt(parts[1]);
          if (monthIndex !== -1) {
            return getPeriodOptions('weekly', year, undefined, monthIndex);
          }
        }
        return getPeriodOptions('weekly');
      }
    }
  };

  const togglePeriodSelection = (type: GoalType, period: string) => {
    setGoalCreationData(prev => {
      const currentPeriods = prev[type].periods;
      const newPeriods = currentPeriods.includes(period)
        ? currentPeriods.filter(p => p !== period)
        : [...currentPeriods, period];
      
      return {
        ...prev,
        [type]: { ...prev[type], periods: newPeriods }
      };
    });
  };

  const handleHierarchicalStepNext = () => {
    if (!newGoalName.trim()) {
      toast({ title: 'Erro', description: 'Digite um nome para o objetivo', variant: 'destructive' });
      return;
    }
    if (goalCreationData[goalCreationStep].periods.length === 0) {
      toast({ title: 'Erro', description: 'Selecione pelo menos um período', variant: 'destructive' });
      return;
    }

    setGoalCreationData(prev => ({
      ...prev,
      [goalCreationStep]: { 
        ...prev[goalCreationStep],
        name: newGoalName.trim()
      }
    }));

    const nextStep = getNextStep(goalCreationStep);
    if (nextStep) {
      setGoalCreationStep(nextStep);
      setNewGoalName(goalCreationData[nextStep].name);
    }
  };

  // Hierarchical - show category step
  const handleHierarchicalProceedToCategory = () => {
    if (!newGoalName.trim()) {
      toast({ title: 'Erro', description: 'Digite um nome para o objetivo', variant: 'destructive' });
      return;
    }
    if (goalCreationData[goalCreationStep].periods.length === 0) {
      toast({ title: 'Erro', description: 'Selecione pelo menos um período', variant: 'destructive' });
      return;
    }
    
    // Store the last step data
    setGoalCreationData(prev => ({
      ...prev,
      [goalCreationStep]: { 
        name: newGoalName.trim(), 
        periods: prev[goalCreationStep].periods 
      }
    }));
    
    setShowCategoryStep(true);
  };

  const handleFinalizeHierarchicalCreation = () => {
    const finalData = {
      ...goalCreationData,
      [goalCreationStep]: { 
        name: newGoalName.trim(), 
        periods: goalCreationData[goalCreationStep].periods 
      }
    };

    // Create all goals in order: yearly -> quarterly -> monthly -> weekly
    const steps: GoalType[] = ['yearly', 'quarterly', 'monthly', 'weekly'];
    let lastCreatedGoalId: string | null = null;
    
    steps.forEach((step) => {
      if (finalData[step].name && finalData[step].periods.length > 0) {
        // Create a goal for each selected period
        finalData[step].periods.forEach((period) => {
          const totalDays = calculateTotalDaysForPeriod(step, period);
          const newGoal = addGoal({
            name: finalData[step].name,
            emoji: newHabitEmoji || undefined,
            type: step,
            period: period,
            progress: 0,
            category: selectedCategory as GoalCategory || undefined,
            categoryXP: selectedCategoryXP,
          });
          lastCreatedGoalId = newGoal.id;
        });
      }
    });

    // Set the last created goal as the linked goal for the habit
    setSelectedGoalId(lastCreatedGoalId);
    resetGoalCreation();
    toast({ title: 'Objetivos criados!', description: 'Agora você pode adicionar o hábito' });
  };

  const resetGoalCreation = () => {
    setShowGoalCreation(false);
    setCreationMode('single');
    setSingleGoalType('');
    setSingleGoalPeriod('');
    setSingleGoalName('');
    setGoalCreationStep('yearly');
    setNewGoalName('');
    setSelectedCategory('');
    setSelectedCategoryXP(20);
    setShowCategoryStep(false);
    setGoalCreationData({
      yearly: { name: '', periods: [] },
      quarterly: { name: '', periods: [] },
      monthly: { name: '', periods: [] },
      weekly: { name: '', periods: [] },
    });
  };

  const getNextStep = (current: GoalType): GoalType | null => {
    const sequence: GoalType[] = ['yearly', 'quarterly', 'monthly', 'weekly'];
    const idx = sequence.indexOf(current);
    return idx < sequence.length - 1 ? sequence[idx + 1] : null;
  };

  const getPrevStep = (current: GoalType): GoalType | null => {
    const sequence: GoalType[] = ['yearly', 'quarterly', 'monthly', 'weekly'];
    const idx = sequence.indexOf(current);
    return idx > 0 ? sequence[idx - 1] : null;
  };

  const getStepLabel = (step: GoalType) => {
    const labels: Record<GoalType, string> = {
      yearly: 'Anual',
      quarterly: 'Trimestral',
      monthly: 'Mensal',
      weekly: 'Semanal',
    };
    return labels[step];
  };

  const isCircular = settings.progressDisplayMode === 'circular';

  // Filter habits to show only on scheduled days using new utility
  const visibleHabits = useMemo(() => {
    return habits.filter((habit) => {
      const linkedGoal = habit.goalId ? goals.find(g => g.id === habit.goalId) : null;
      return isHabitScheduledForDate(habit, viewDate, linkedGoal);
    });
  }, [habits, viewDate, goals]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-6">
        {/* Habit list section */}
        <div className="flex-1">
          {/* Title */}
          <h3 className="font-semibold text-foreground text-lg mb-3">Hábitos do dia</h3>
          
          {/* Day navigation and Add button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1" />
            <div className="flex items-center gap-1 bg-muted/20 rounded-xl px-2 py-1">
              <button
                onClick={() => navigateDay(-1)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-foreground font-medium min-w-[80px] text-center">{formatViewDate()}</span>
              <button
                onClick={() => navigateDay(1)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="p-2 rounded-xl text-foreground bg-muted/50 border border-border/50 hover:bg-muted/70 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 space-y-3"
              >
                {!showGoalCreation ? (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Emoji"
                        value={newHabitEmoji}
                        onChange={(e) => setNewHabitEmoji(e.target.value)}
                        className="w-14 bg-muted/50 border border-border/50 rounded-xl px-3 py-2 text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        maxLength={2}
                      />
                      <input
                        type="text"
                        placeholder="Nome do hábito"
                        value={newHabitName}
                        onChange={(e) => setNewHabitName(e.target.value)}
                        className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <select
                        value={selectedGoalId || ''}
                        onChange={(e) => setSelectedGoalId(e.target.value || null)}
                        className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        <option value="">Vincular a um objetivo (opcional)</option>
                        {goals.map((goal) => (
                          <option key={goal.id} value={goal.id}>
                            {goal.emoji && `${goal.emoji} `}{goal.name} ({getStepLabel(goal.type)})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowGoalCreation(true)}
                        className="px-3 py-2 bg-secondary/20 text-secondary-foreground rounded-xl text-sm font-medium hover:bg-secondary/30 transition-colors"
                      >
                        Criar objetivo
                      </button>
                    </div>

                    {/* Day Selection */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Repetição</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsOneTimeHabit(false)}
                          className={cn(
                            'flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all',
                            !isOneTimeHabit
                              ? 'gradient-primary text-primary-foreground'
                              : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                          )}
                        >
                          Repetir
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsOneTimeHabit(true)}
                          className={cn(
                            'flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all',
                            isOneTimeHabit
                              ? 'gradient-primary text-primary-foreground'
                              : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                          )}
                        >
                          Evento único
                        </button>
                      </div>
                      
                      {!isOneTimeHabit && (
                        <>
                          {/* Frequency selection */}
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Frequência:</span>
                            <div className="grid grid-cols-4 gap-1">
                              {([1, 2, 3, 4] as const).map((freq) => (
                                <button
                                  key={freq}
                                  type="button"
                                  onClick={() => setRepeatFrequency(freq)}
                                  className={cn(
                                    'py-1.5 px-1 rounded-lg text-xs font-medium transition-all',
                                    repeatFrequency === freq
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                                  )}
                                >
                                  {freq === 1 ? 'Toda sem.' : `${freq} sem.`}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Week days selection */}
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Dias:</span>
                            <div className="flex gap-1">
                              {WEEK_DAYS.map((day) => (
                                <button
                                  key={day.value}
                                  type="button"
                                  onClick={() => toggleWeekDay(day.value)}
                                  className={cn(
                                    'flex-1 py-1.5 px-1 rounded-lg text-xs font-medium transition-all',
                                    selectedWeekDays.includes(day.value)
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                                  )}
                                >
                                  {day.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      onClick={handleAddHabit}
                      className="w-full px-4 py-2 gradient-primary text-primary-foreground rounded-xl font-medium text-sm"
                    >
                      Adicionar hábito
                    </button>
                  </>
                ) : (
                  <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">Criar objetivo</h4>
                      <button
                        onClick={resetGoalCreation}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Category Step */}
                    {showCategoryStep ? (
                      <div className="space-y-4">
                        <h5 className="text-sm font-medium text-foreground">Categoria e XP</h5>
                        
                        {/* Category selection */}
                        <div>
                          <label className="text-xs text-muted-foreground mb-2 block">Categoria (opcional)</label>
                          <div className="flex flex-wrap gap-2">
                            {DEFAULT_CATEGORIES.map((cat) => (
                              <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={cn(
                                  'px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1',
                                  selectedCategory === cat.id
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
                                  onClick={() => setSelectedCategory(cat.name)}
                                  className={cn(
                                    'px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1',
                                    selectedCategory === cat.name
                                      ? 'gradient-fire text-primary-foreground'
                                      : 'bg-muted/30 border border-border/50 hover:bg-muted/50'
                                  )}
                                >
                                  {cat.emoji && <span>{cat.emoji}</span>}
                                  <span>{cat.name}</span>
                                </button>
                                <button
                                  onClick={() => setEditingCategory(cat)}
                                  className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 p-1 bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => setShowNewCategoryModal(true)}
                              className="px-3 py-2 rounded-xl text-xs bg-muted/30 border border-dashed border-border hover:bg-muted/50 transition-all flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Nova
                            </button>
                          </div>
                        </div>

                        {/* XP selection */}
                        <div>
                          <label className="text-xs text-muted-foreground mb-2 block">XP por hábito concluído</label>
                          <div className="flex gap-1 flex-wrap">
                            {XP_OPTIONS.map((xp) => (
                              <button
                                key={xp}
                                onClick={() => setSelectedCategoryXP(xp)}
                                className={cn(
                                  'px-3 py-2 rounded-lg text-xs font-medium transition-all',
                                  selectedCategoryXP === xp
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                                )}
                              >
                                {xp} XP
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowCategoryStep(false)}
                            className="flex-1 px-4 py-2 bg-muted/50 text-foreground rounded-xl font-medium text-sm hover:bg-muted/70 transition-colors"
                          >
                            Voltar
                          </button>
                          <button
                            onClick={creationMode === 'single' ? handleCreateSingleGoal : handleFinalizeHierarchicalCreation}
                            className="flex-1 px-4 py-2 gradient-primary text-primary-foreground rounded-xl font-medium text-sm"
                          >
                            Criar objetivo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Mode selection */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCreationMode('single')}
                            className={cn(
                              'flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all',
                              creationMode === 'single'
                                ? 'gradient-primary text-primary-foreground'
                                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                            )}
                          >
                            Período único
                          </button>
                          <button
                            onClick={() => setCreationMode('hierarchical')}
                            className={cn(
                              'flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all',
                              creationMode === 'hierarchical'
                                ? 'gradient-primary text-primary-foreground'
                                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                            )}
                          >
                            Hierárquico
                          </button>
                        </div>

                        {creationMode === 'single' ? (
                          <>
                            {/* Single goal creation */}
                            <input
                              type="text"
                              placeholder="Nome do objetivo"
                              value={singleGoalName}
                              onChange={(e) => setSingleGoalName(e.target.value)}
                              className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                            />

                            {/* Period type selection */}
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Tipo de período</label>
                              <div className="grid grid-cols-4 gap-1">
                                {(['yearly', 'quarterly', 'monthly', 'weekly'] as GoalType[]).map((type) => (
                                  <button
                                    key={type}
                                    onClick={() => {
                                      setSingleGoalType(type);
                                      setSingleGoalPeriod('');
                                    }}
                                    className={cn(
                                      'py-2 px-2 rounded-lg text-xs font-medium transition-all',
                                      singleGoalType === type
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                                    )}
                                  >
                                    {getStepLabel(type)}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Period selection */}
                            {singleGoalType && (
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Período</label>
                                <select
                                  value={singleGoalPeriod}
                                  onChange={(e) => setSingleGoalPeriod(e.target.value)}
                                  className="w-full bg-muted/50 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                                >
                                  <option value="">Selecione um período</option>
                                  {getPeriodOptions(singleGoalType).map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                                {singleGoalPeriod && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Total: {calculateTotalDaysForPeriod(singleGoalType, singleGoalPeriod)} dias
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button
                                onClick={resetGoalCreation}
                                className="flex-1 px-4 py-2 bg-muted/50 text-foreground rounded-xl font-medium text-sm hover:bg-muted/70 transition-colors"
                              >
                                Voltar
                              </button>
                              <button
                                onClick={handleSingleGoalProceedToCategory}
                                disabled={!singleGoalName.trim() || !singleGoalType || !singleGoalPeriod}
                                className="flex-1 px-4 py-2 gradient-primary text-primary-foreground rounded-xl font-medium text-sm disabled:opacity-50"
                              >
                                Próximo
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Hierarchical goal creation */}
                            <div className="flex gap-1 mb-2">
                              {(['yearly', 'quarterly', 'monthly', 'weekly'] as GoalType[]).map((step, i) => (
                                <div
                                  key={step}
                                  className={cn(
                                    'flex-1 h-1 rounded-full transition-colors',
                                    i <= ['yearly', 'quarterly', 'monthly', 'weekly'].indexOf(goalCreationStep)
                                      ? 'bg-primary'
                                      : 'bg-muted'
                                  )}
                                />
                              ))}
                            </div>

                            <h5 className="text-sm font-medium text-foreground">
                              Objetivo {getStepLabel(goalCreationStep)}
                            </h5>

                            <input
                              type="text"
                              placeholder={`Nome do objetivo ${getStepLabel(goalCreationStep).toLowerCase()}`}
                              value={newGoalName}
                              onChange={(e) => setNewGoalName(e.target.value)}
                              className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                            />

                            {/* Multi-select period */}
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">
                                Períodos (selecione um ou mais)
                              </label>
                              
                              {/* Select All button */}
                              <button
                                onClick={() => {
                                  const allOptions = getFilteredOptions(goalCreationStep).map(o => o.value);
                                  const allSelected = allOptions.every(v => goalCreationData[goalCreationStep].periods.includes(v));
                                  setGoalCreationData(prev => ({
                                    ...prev,
                                    [goalCreationStep]: { 
                                      ...prev[goalCreationStep], 
                                      periods: allSelected ? [] : allOptions 
                                    }
                                  }));
                                }}
                                className={cn(
                                  'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all mb-2 border-2 border-dashed',
                                  getFilteredOptions(goalCreationStep).every(o => goalCreationData[goalCreationStep].periods.includes(o.value))
                                    ? 'bg-primary/20 border-primary text-primary'
                                    : 'bg-muted/30 border-border/50 text-foreground hover:bg-muted/50'
                                )}
                              >
                                ✓ Selecionar todos
                              </button>

                              {/* Quick select options for weeks */}
                              {goalCreationStep === 'weekly' && (
                                <div className="space-y-1 mb-2 p-2 rounded-xl bg-secondary/10 border border-secondary/30">
                                  <p className="text-xs font-medium text-secondary-foreground mb-1">Seleção rápida:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {/* All weeks of the year */}
                                    {generateYearOptions().map(year => (
                                      <button
                                        key={`year-${year.value}`}
                                        onClick={() => {
                                          const yearWeeks = getFilteredOptions('weekly').filter(o => o.value.includes(year.value)).map(o => o.value);
                                          const allSelected = yearWeeks.every(v => goalCreationData.weekly.periods.includes(v));
                                          setGoalCreationData(prev => ({
                                            ...prev,
                                            weekly: { 
                                              ...prev.weekly, 
                                              periods: allSelected 
                                                ? prev.weekly.periods.filter(p => !yearWeeks.includes(p))
                                                : [...new Set([...prev.weekly.periods, ...yearWeeks])]
                                            }
                                          }));
                                        }}
                                        className="px-2 py-1 rounded-lg text-xs font-medium bg-secondary/20 hover:bg-secondary/30 text-secondary-foreground transition-all"
                                      >
                                        Ano {year.value}
                                      </button>
                                    ))}
                                    {/* 1st and 2nd semester */}
                                    {generateYearOptions().map(year => (
                                      <React.Fragment key={`sem-${year.value}`}>
                                        <button
                                          onClick={() => {
                                            const s1Weeks = getFilteredOptions('weekly').filter(o => {
                                              const match = o.value.match(/Semana (\d+) - (\d+)/);
                                              if (!match) return false;
                                              return parseInt(match[2]) === parseInt(year.value) && parseInt(match[1]) <= 26;
                                            }).map(o => o.value);
                                            const allSelected = s1Weeks.every(v => goalCreationData.weekly.periods.includes(v));
                                            setGoalCreationData(prev => ({
                                              ...prev,
                                              weekly: { 
                                                ...prev.weekly, 
                                                periods: allSelected 
                                                  ? prev.weekly.periods.filter(p => !s1Weeks.includes(p))
                                                  : [...new Set([...prev.weekly.periods, ...s1Weeks])]
                                              }
                                            }));
                                          }}
                                          className="px-2 py-1 rounded-lg text-xs font-medium bg-secondary/20 hover:bg-secondary/30 text-secondary-foreground transition-all"
                                        >
                                          1º Sem {year.value}
                                        </button>
                                        <button
                                          onClick={() => {
                                            const s2Weeks = getFilteredOptions('weekly').filter(o => {
                                              const match = o.value.match(/Semana (\d+) - (\d+)/);
                                              if (!match) return false;
                                              return parseInt(match[2]) === parseInt(year.value) && parseInt(match[1]) > 26;
                                            }).map(o => o.value);
                                            const allSelected = s2Weeks.every(v => goalCreationData.weekly.periods.includes(v));
                                            setGoalCreationData(prev => ({
                                              ...prev,
                                              weekly: { 
                                                ...prev.weekly, 
                                                periods: allSelected 
                                                  ? prev.weekly.periods.filter(p => !s2Weeks.includes(p))
                                                  : [...new Set([...prev.weekly.periods, ...s2Weeks])]
                                              }
                                            }));
                                          }}
                                          className="px-2 py-1 rounded-lg text-xs font-medium bg-secondary/20 hover:bg-secondary/30 text-secondary-foreground transition-all"
                                        >
                                          2º Sem {year.value}
                                        </button>
                                      </React.Fragment>
                                    ))}
                                  </div>
                                  {/* Months */}
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((monthLabel, monthIndex) => {
                                      const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
                                      return (
                                        <button
                                          key={monthLabel}
                                          onClick={() => {
                                            const monthWeeks = getFilteredOptions('weekly').filter(o => {
                                              return o.label.toLowerCase().includes(monthNames[monthIndex]);
                                            }).map(o => o.value);
                                            const allSelected = monthWeeks.length > 0 && monthWeeks.every(v => goalCreationData.weekly.periods.includes(v));
                                            setGoalCreationData(prev => ({
                                              ...prev,
                                              weekly: { 
                                                ...prev.weekly, 
                                                periods: allSelected 
                                                  ? prev.weekly.periods.filter(p => !monthWeeks.includes(p))
                                                  : [...new Set([...prev.weekly.periods, ...monthWeeks])]
                                              }
                                            }));
                                          }}
                                          className="px-2 py-1 rounded-lg text-xs font-medium bg-muted/50 hover:bg-muted/70 text-foreground transition-all"
                                        >
                                          {monthLabel}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              <div className="max-h-40 overflow-y-auto space-y-1 bg-muted/20 rounded-xl p-2">
                                {getFilteredOptions(goalCreationStep).map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => togglePeriodSelection(goalCreationStep, option.value)}
                                    className={cn(
                                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-all',
                                      goalCreationData[goalCreationStep].periods.includes(option.value)
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted/30 text-foreground hover:bg-muted/50'
                                    )}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {goalCreationData[goalCreationStep].periods.length} selecionado(s)
                              </p>
                            </div>
                            
                            <div className="flex gap-2">
                              {goalCreationStep !== 'yearly' ? (
                                <button
                                  onClick={() => {
                                    const prevStep = getPrevStep(goalCreationStep);
                                    if (prevStep) {
                                      setGoalCreationStep(prevStep);
                                      setNewGoalName(goalCreationData[prevStep].name);
                                    }
                                  }}
                                  className="flex-1 px-4 py-2 bg-muted/50 text-foreground rounded-xl font-medium text-sm hover:bg-muted/70 transition-colors"
                                >
                                  Voltar
                                </button>
                              ) : (
                                <button
                                  onClick={resetGoalCreation}
                                  className="flex-1 px-4 py-2 bg-muted/50 text-foreground rounded-xl font-medium text-sm hover:bg-muted/70 transition-colors"
                                >
                                  Voltar
                                </button>
                              )}
                              <button
                                onClick={getNextStep(goalCreationStep) ? handleHierarchicalStepNext : handleHierarchicalProceedToCategory}
                                disabled={!newGoalName.trim() || goalCreationData[goalCreationStep].periods.length === 0}
                                className="flex-1 px-4 py-2 gradient-primary text-primary-foreground rounded-xl font-medium text-sm disabled:opacity-50"
                              >
                                {getNextStep(goalCreationStep) ? 'Próximo' : 'Próximo'}
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </motion.div>
              )}
            </AnimatePresence>

            {/* New Category Modal */}
          <AnimatePresence>
            {(showNewCategoryModal || editingCategory) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                onClick={() => { setShowNewCategoryModal(false); setEditingCategory(null); }}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-xl"
                >
                  <h3 className="text-lg font-bold mb-4">{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="🎯"
                        value={editingCategory ? editingCategory.emoji || '' : newCategoryEmoji}
                        onChange={(e) => editingCategory 
                          ? setEditingCategory({...editingCategory, emoji: e.target.value})
                          : setNewCategoryEmoji(e.target.value)
                        }
                        className="w-14 p-3 rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:border-primary text-center text-xl"
                        maxLength={2}
                      />
                      <input
                        type="text"
                        placeholder="Nome da categoria"
                        value={editingCategory ? editingCategory.name : newCategoryName}
                        onChange={(e) => editingCategory
                          ? setEditingCategory({...editingCategory, name: e.target.value})
                          : setNewCategoryName(e.target.value)
                        }
                        className="flex-1 p-3 rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">XP padrão</label>
                      <div className="flex gap-1 flex-wrap">
                        {XP_OPTIONS.map((xp) => (
                          <button
                            key={xp}
                            onClick={() => editingCategory
                              ? setEditingCategory({...editingCategory, xpReward: xp})
                              : setNewCategoryXP(xp)
                            }
                            className={cn(
                              'px-3 py-2 rounded-lg text-xs font-medium transition-all',
                              (editingCategory ? editingCategory.xpReward : newCategoryXP) === xp
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                            )}
                          >
                            {xp} XP
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowNewCategoryModal(false); setEditingCategory(null); }}
                        className="flex-1 px-4 py-2 bg-muted/50 text-foreground rounded-xl font-medium text-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          if (editingCategory) {
                            updateCustomCategory(editingCategory.id, {
                              name: editingCategory.name,
                              emoji: editingCategory.emoji,
                              xpReward: editingCategory.xpReward,
                            });
                            setEditingCategory(null);
                          } else {
                            addCustomCategory({
                              name: newCategoryName,
                              emoji: newCategoryEmoji,
                              xpReward: newCategoryXP,
                            });
                            setShowNewCategoryModal(false);
                            setNewCategoryName('');
                            setNewCategoryEmoji('🎯');
                            setNewCategoryXP(20);
                          }
                        }}
                        className="flex-1 px-4 py-2 gradient-primary text-primary-foreground rounded-xl font-medium text-sm"
                      >
                        {editingCategory ? 'Salvar' : 'Criar'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div 
            className="space-y-2"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDrag}
          >
            {visibleHabits.map((habit, index) => {
              const check = getHabitCheckForDate(habit.id, viewDateStr);
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
                    {habit.notificationEnabled && (
                      <Bell className="w-3.5 h-3.5 text-primary" />
                    )}
                    <span className="text-xs text-muted-foreground">+{habit.xpReward} XP</span>
                  </div>
                </motion.div>
              );
            })}

            {visibleHabits.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum hábito para hoje</p>
                <p className="text-sm">Clique no + para adicionar</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Progress indicators on the right side - vertically centered */}
        <div className={cn(
          "flex flex-col justify-center gap-4 self-center",
          isCircular ? "items-center" : "min-w-[110px]"
        )}>
          {isCircular ? (
            <>
              <CircularProgress value={dailyProgress} label="Dia" delay={0} />
              <CircularProgress value={weeklyProgress} label="Semana" delay={0.1} />
            </>
          ) : (
            <>
              <LinearProgress value={dailyProgress} label="Dia" delay={0} />
              <LinearProgress value={weeklyProgress} label="Semana" delay={0.1} />
            </>
          )}
        </div>
      </div>

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
