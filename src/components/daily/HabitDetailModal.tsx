import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Bell, Calendar, TrendingUp, Link, Sparkles, Trash2, ChevronLeft, ChevronRight, Check, Tag } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Habit, GoalType, GoalCategory, DEFAULT_CATEGORIES, XP_OPTIONS, CustomCategory } from '@/types';
import { EmojiPickerButton } from '@/components/ui/EmojiPickerButton';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, addMonths, format, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { calculateHabitProgress } from '@/utils/habitInstanceCalculator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface HabitDetailModalProps {
  habit: Habit;
  isOpen: boolean;
  onClose: () => void;
}

const WEEK_DAYS = [
  { value: 0, label: 'Dom', fullLabel: 'Domingo' },
  { value: 1, label: 'Seg', fullLabel: 'Segunda' },
  { value: 2, label: 'Ter', fullLabel: 'Terça' },
  { value: 3, label: 'Qua', fullLabel: 'Quarta' },
  { value: 4, label: 'Qui', fullLabel: 'Quinta' },
  { value: 5, label: 'Sex', fullLabel: 'Sexta' },
  { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
];

const MONTH_WEEKS = [
  { value: 1, label: '1ª Sem', fullLabel: 'Primeira semana' },
  { value: 2, label: '2ª Sem', fullLabel: 'Segunda semana' },
  { value: 3, label: '3ª Sem', fullLabel: 'Terceira semana' },
  { value: 4, label: '4ª Sem', fullLabel: 'Quarta semana' },
  { value: 5, label: '5ª Sem', fullLabel: 'Quinta semana' },
];

export const HabitDetailModal = ({ habit, isOpen, onClose }: HabitDetailModalProps) => {
  const { 
    goals, 
    habitChecks, 
    updateHabit, 
    addGoal,
    customCategories,
    removeHabit
  } = useAppStore();

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [habitEmoji, setHabitEmoji] = useState(habit.emoji || '');
  
  // Progress history view state
  const [historyView, setHistoryView] = useState<'week' | 'month'>('week');
  const [historyDate, setHistoryDate] = useState(new Date());

  // Get linked goal to find current category
  const linkedGoal = habit.goalId ? goals.find(g => g.id === habit.goalId) : null;

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(habit.goalId || null);
  const [showGoalCreation, setShowGoalCreation] = useState(false);
  const [goalCreationStep, setGoalCreationStep] = useState<GoalType>('yearly');
  const [newGoalName, setNewGoalName] = useState('');
  const [createdGoalIds, setCreatedGoalIds] = useState<Record<GoalType, string>>({} as Record<GoalType, string>);
  const [weekDays, setWeekDays] = useState<number[]>(habit.weekDays || [1, 2, 3, 4, 5]);
  const [monthWeeks, setMonthWeeks] = useState<number[]>(habit.monthWeeks || []);
  const [isOneTime, setIsOneTime] = useState(habit.isOneTime || false);
  const [repeatFrequency, setRepeatFrequency] = useState<1 | 2 | 3 | 4>(habit.repeatFrequency || 1);
  const [notificationEnabled, setNotificationEnabled] = useState(habit.notificationEnabled || false);
  const [notificationTime, setNotificationTime] = useState(habit.notificationTime || '09:00');
  
  // XP reward state
  const [xpReward, setXpReward] = useState<number>(habit.xpReward || 10);

  // Calculate habit progress using the new utility
  const habitProgress = useMemo(() => {
    const linkedGoal = habit.goalId ? goals.find(g => g.id === habit.goalId) : null;
    return calculateHabitProgress(habit, linkedGoal, habitChecks);
  }, [habit, goals, habitChecks]);

  // Calculate habit progress history from creation date
  const progressHistory = useMemo(() => {
    const history: { date: string; completed: boolean }[] = [];
    const today = new Date();
    const createdDate = new Date(habit.createdAt);
    
    // Calculate days since creation (max 30)
    const daysSinceCreation = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysToShow = Math.min(daysSinceCreation + 1, 30);
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const check = habitChecks.find(hc => hc.habitId === habit.id && hc.date === dateStr);
      history.push({ date: dateStr, completed: check?.completed || false });
    }
    
    return history;
  }, [habit.id, habit.createdAt, habitChecks]);

  // Get linked goals hierarchy
  const linkedGoals = useMemo(() => {
    if (!habit.goalId) return [];
    
    const result: { goal: typeof goals[0]; type: GoalType }[] = [];
    let currentGoal = goals.find(g => g.id === habit.goalId);
    
    while (currentGoal) {
      result.push({ goal: currentGoal, type: currentGoal.type });
      currentGoal = currentGoal.parentGoalId 
        ? goals.find(g => g.id === currentGoal!.parentGoalId) 
        : undefined;
    }
    
    return result;
  }, [habit.goalId, goals]);

  const toggleWeekDay = (day: number) => {
    if (isOneTime) return;
    setWeekDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const toggleMonthWeek = (week: number) => {
    if (isOneTime) return;
    setMonthWeeks(prev => 
      prev.includes(week) 
        ? prev.filter(w => w !== week)
        : [...prev, week].sort()
    );
  };

  // Calculate days to show for history based on view
  const historyDays = useMemo(() => {
    if (historyView === 'week') {
      const weekStart = startOfWeek(historyDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(historyDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else {
      const monthStart = startOfMonth(historyDate);
      const monthEnd = endOfMonth(historyDate);
      return eachDayOfInterval({ start: monthStart, end: monthEnd });
    }
  }, [historyView, historyDate]);

  const navigateHistory = (direction: number) => {
    if (historyView === 'week') {
      setHistoryDate(addWeeks(historyDate, direction));
    } else {
      setHistoryDate(addMonths(historyDate, direction));
    }
  };

  const getHistoryLabel = () => {
    if (historyView === 'week') {
      const weekStart = startOfWeek(historyDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(historyDate, { weekStartsOn: 1 });
      return `${format(weekStart, 'd MMM', { locale: ptBR })} - ${format(weekEnd, 'd MMM', { locale: ptBR })}`;
    } else {
      return format(historyDate, 'MMMM yyyy', { locale: ptBR });
    }
  };

  const handleSave = () => {
    updateHabit(habit.id, {
      emoji: habitEmoji || undefined,
      goalId: selectedGoalId || undefined,
      weekDays: isOneTime ? undefined : weekDays,
      monthWeeks: isOneTime ? undefined : (monthWeeks.length > 0 ? monthWeeks : undefined),
      isOneTime,
      repeatFrequency: isOneTime ? undefined : repeatFrequency,
      notificationEnabled,
      notificationTime,
      xpReward,
    });
    toast({ title: 'Hábito atualizado!', description: 'As alterações foram salvas.' });
    onClose();
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

  const getNextStep = (current: GoalType): GoalType | null => {
    const sequence: GoalType[] = ['yearly', 'quarterly', 'monthly', 'weekly'];
    const idx = sequence.indexOf(current);
    return idx < sequence.length - 1 ? sequence[idx + 1] : null;
  };

  const getParentType = (current: GoalType): GoalType => {
    const map: Record<GoalType, GoalType> = {
      weekly: 'monthly',
      monthly: 'quarterly',
      quarterly: 'yearly',
      yearly: 'yearly',
    };
    return map[current];
  };

  const handleCreateGoalSequence = () => {
    if (!newGoalName.trim()) {
      toast({ title: 'Erro', description: 'Digite um nome para o objetivo', variant: 'destructive' });
      return;
    }

    const year = new Date().getFullYear();
    const quarter = Math.ceil((new Date().getMonth() + 1) / 3);
    const month = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const week = Math.ceil((new Date().getDate() + new Date(year, new Date().getMonth(), 1).getDay()) / 7);

    const periods: Record<GoalType, string> = {
      yearly: year.toString(),
      quarterly: `${quarter}º Tri - ${year}`,
      monthly: month,
      weekly: `Semana ${week} - ${new Date().toLocaleDateString('pt-BR', { month: 'long' })}`,
    };

    const newGoal = addGoal({
      name: newGoalName.trim(),
      emoji: habit.emoji || undefined,
      type: goalCreationStep,
      period: periods[goalCreationStep],
      progress: 0,
      parentGoalId: createdGoalIds[getParentType(goalCreationStep)] || undefined,
    });

    setCreatedGoalIds(prev => ({ ...prev, [goalCreationStep]: newGoal.id }));

    const nextStep = getNextStep(goalCreationStep);
    if (nextStep) {
      setGoalCreationStep(nextStep);
      setNewGoalName('');
    } else {
      setSelectedGoalId(newGoal.id);
      setShowGoalCreation(false);
      setGoalCreationStep('yearly');
      setNewGoalName('');
      setCreatedGoalIds({} as Record<GoalType, string>);
      toast({ title: 'Objetivos criados!', description: 'Hábito vinculado com sucesso.' });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              <EmojiPickerButton
                value={habitEmoji}
                onChange={setHabitEmoji}
                placeholder={habit.emoji || '🎯'}
                className="w-12 h-12"
              />
              <div>
                <h2 className="text-lg font-semibold text-foreground">{habit.name}</h2>
                <p className="text-sm text-primary font-medium">
                  {habitProgress.completed}/{habitProgress.total} ({habitProgress.percentage}%)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* Progress History */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-foreground">Histórico de Progresso</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHistoryView(historyView === 'week' ? 'month' : 'week')}
                    className="px-2 py-1 text-xs font-medium bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                  >
                    {historyView === 'week' ? 'Semana' : 'Mês'}
                  </button>
                </div>
              </div>
              
              {/* Navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => navigateHistory(-1)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-foreground">{getHistoryLabel()}</span>
                <button
                  onClick={() => navigateHistory(1)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              {/* History Grid */}
              {historyView === 'week' ? (
                <div className="grid grid-cols-7 gap-2">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, i) => (
                    <span key={day} className="text-xs text-muted-foreground text-center">{day}</span>
                  ))}
                  {historyDays.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const check = habitChecks.find(hc => hc.habitId === habit.id && hc.date === dateStr);
                    const isCompleted = check?.completed || false;
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <div
                        key={dateStr}
                        className={cn(
                          'aspect-square rounded-lg flex items-center justify-center transition-all',
                          isCompleted 
                            ? 'bg-primary' 
                            : 'bg-muted/30',
                          isToday && 'ring-2 ring-primary ring-offset-2 ring-offset-card'
                        )}
                        title={`${format(day, 'd MMM', { locale: ptBR })} - ${isCompleted ? 'Concluído' : 'Não concluído'}`}
                      >
                        {isCompleted && <Check className="w-4 h-4 text-primary-foreground" />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
                    <span key={day} className="text-[10px] text-muted-foreground text-center">{day}</span>
                  ))}
                  {/* Add empty cells for alignment */}
                  {(() => {
                    const monthStart = startOfMonth(historyDate);
                    const dayOfWeek = monthStart.getDay();
                    const emptyDays = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    return Array.from({ length: emptyDays }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ));
                  })()}
                  {historyDays.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const check = habitChecks.find(hc => hc.habitId === habit.id && hc.date === dateStr);
                    const isCompleted = check?.completed || false;
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <div
                        key={dateStr}
                        className={cn(
                          'aspect-square rounded flex items-center justify-center text-[10px] transition-all',
                          isCompleted 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted/30 text-muted-foreground',
                          isToday && 'ring-1 ring-primary'
                        )}
                        title={`${format(day, 'd MMM', { locale: ptBR })} - ${isCompleted ? 'Concluído' : 'Não concluído'}`}
                      >
                        {isCompleted ? <Check className="w-3 h-3" /> : format(day, 'd')}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Linked Goals Progress */}
            {linkedGoals.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-foreground">Progresso dos Objetivos</h3>
                </div>
                
                <div className="space-y-3">
                  {linkedGoals.map(({ goal, type }) => (
                    <div key={goal.id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-20">{getStepLabel(type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-foreground">{goal.name}</span>
                          <span className="text-xs font-semibold text-primary">{goal.progress}%</span>
                        </div>
                        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${goal.progress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Goal Linking Section */}
            {!showGoalCreation ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Link className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-foreground">Vincular a Objetivo</h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <select
                    value={selectedGoalId || ''}
                    onChange={(e) => setSelectedGoalId(e.target.value || null)}
                    className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="">Sem vínculo</option>
                    {goals.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.emoji && `${goal.emoji} `}{goal.name} ({getStepLabel(goal.type)})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowGoalCreation(true)}
                    className="px-3 py-2 bg-secondary/20 text-secondary-foreground rounded-xl text-sm font-medium hover:bg-secondary/30 transition-colors whitespace-nowrap"
                  >
                    Criar
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">Criar objetivo - {getStepLabel(goalCreationStep)}</h4>
                  <button
                    onClick={() => {
                      setShowGoalCreation(false);
                      setGoalCreationStep('yearly');
                      setNewGoalName('');
                      setCreatedGoalIds({} as Record<GoalType, string>);
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
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

                <input
                  type="text"
                  placeholder={`Nome do objetivo ${getStepLabel(goalCreationStep).toLowerCase()}`}
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                
                <button
                  onClick={handleCreateGoalSequence}
                  className="w-full px-4 py-2 gradient-primary text-primary-foreground rounded-xl font-medium text-sm"
                >
                  {getNextStep(goalCreationStep) ? 'Próximo' : 'Concluir'}
                </button>
              </div>
            )}

            {/* Day Selection */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">Repetição</h3>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => setIsOneTime(!isOneTime)}
                  className={cn(
                    'w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2',
                    isOneTime
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/50'
                  )}
                >
                  <Calendar className="w-4 h-4" />
                  Evento único (sem repetição)
                </button>
                
                {!isOneTime && (
                  <>
                    {/* Frequency selection */}
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground">Frequência semanal:</span>
                      <div className="grid grid-cols-4 gap-1">
                        {([1, 2, 3, 4] as const).map((freq) => (
                          <button
                            key={freq}
                            onClick={() => setRepeatFrequency(freq)}
                            className={cn(
                              'py-2 px-2 rounded-lg text-xs font-medium transition-all',
                              repeatFrequency === freq
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                            )}
                          >
                            {freq === 1 ? 'Toda semana' : `A cada ${freq} sem.`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Week days selection */}
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground">Dias da semana:</span>
                      <div className="flex gap-1">
                        {WEEK_DAYS.map((day) => (
                          <button
                            key={day.value}
                            onClick={() => toggleWeekDay(day.value)}
                            className={cn(
                              'flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all',
                              weekDays.includes(day.value)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                            )}
                            title={day.fullLabel}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Month weeks selection */}
                    <div className="space-y-2">
                      <span className="text-xs text-muted-foreground">Semanas específicas do mês (opcional):</span>
                      <div className="flex gap-1">
                        {MONTH_WEEKS.map((week) => (
                          <button
                            key={week.value}
                            onClick={() => toggleMonthWeek(week.value)}
                            className={cn(
                              'flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all',
                              monthWeeks.includes(week.value)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                            )}
                            title={week.fullLabel}
                          >
                            {week.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {monthWeeks.length === 0 
                          ? 'Todas as semanas do mês' 
                          : `Apenas semana${monthWeeks.length > 1 ? 's' : ''} ${monthWeeks.join(', ')}`
                        }
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* XP Reward */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">XP por Conclusão</h3>
              </div>
              
              <div className="grid grid-cols-6 gap-2">
                {XP_OPTIONS.map((xp) => (
                  <button
                    key={xp}
                    onClick={() => setXpReward(xp)}
                    className={cn(
                      'py-2 rounded-xl text-sm font-medium transition-all',
                      xpReward === xp
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/50'
                    )}
                  >
                    {xp}
                  </button>
                ))}
              </div>
            </div>

            {/* Category (from linked goal - read-only) */}
            {linkedGoal && linkedGoal.category && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-foreground">Categoria</h3>
                </div>
                
                <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                  <div className="flex items-center gap-2">
                    {(() => {
                      if (linkedGoal.customCategoryId) {
                        const customCat = customCategories.find(c => c.id === linkedGoal.customCategoryId);
                        if (customCat) {
                          return (
                            <>
                              <span className="text-lg">{customCat.emoji}</span>
                              <span className="text-sm font-medium text-foreground">{customCat.name}</span>
                              <span className="text-xs text-muted-foreground ml-auto">{customCat.xpReward} XP</span>
                            </>
                          );
                        }
                      }
                      const defaultCat = DEFAULT_CATEGORIES.find(c => c.id === linkedGoal.category);
                      if (defaultCat) {
                        return (
                          <>
                            <span className="text-lg">{defaultCat.emoji}</span>
                            <span className="text-sm font-medium text-foreground">{defaultCat.name}</span>
                            {linkedGoal.categoryXP !== undefined && (
                              <span className="text-xs text-muted-foreground ml-auto">{linkedGoal.categoryXP} XP</span>
                            )}
                          </>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    A categoria é definida pelo objetivo vinculado. Edite o objetivo para alterar.
                  </p>
                </div>
              </div>
            )}

            {/* Notifications */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">Notificações</h3>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => setNotificationEnabled(!notificationEnabled)}
                  className={cn(
                    'w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2',
                    notificationEnabled
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/50'
                  )}
                >
                  <Bell className="w-4 h-4" />
                  {notificationEnabled ? 'Notificação ativada' : 'Ativar notificação'}
                </button>
                
                {notificationEnabled && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Horário:</span>
                    <input
                      type="time"
                      value={notificationTime}
                      onChange={(e) => setNotificationTime(e.target.value)}
                      className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="w-full px-4 py-3 gradient-primary text-primary-foreground rounded-xl font-medium"
            >
              Salvar Alterações
            </button>

            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteConfirmation(true)}
              className="w-full py-3 flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir hábito</span>
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir hábito</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o hábito "{habit.name}"? Esta ação não pode ser desfeita e todo o histórico de progresso será perdido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                removeHabit(habit.id);
                toast({ title: 'Hábito excluído!', description: `"${habit.name}" foi removido.` });
                onClose();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatePresence>
  );
};
