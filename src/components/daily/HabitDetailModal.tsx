import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Bell, Calendar, TrendingUp, Link, Pencil, Tag, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Habit, GoalType, GoalCategory, DEFAULT_CATEGORIES, XP_OPTIONS, CustomCategory } from '@/types';
import { toast } from '@/hooks/use-toast';
import { calculateHabitProgress } from '@/utils/habitInstanceCalculator';

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
    settings,
    customCategories,
    addCustomCategory,
    updateCustomCategory
  } = useAppStore();

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
  
  // Category editing state
  const [xpReward, setXpReward] = useState<number>(habit.xpReward || 10);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('⭐');
  const [newCategoryXP, setNewCategoryXP] = useState(10);

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

  const handleSave = () => {
    updateHabit(habit.id, {
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

  const handleSaveCategory = () => {
    if (!newCategoryName.trim()) {
      toast({ title: 'Erro', description: 'Digite um nome para a categoria', variant: 'destructive' });
      return;
    }
    
    if (editingCategory) {
      updateCustomCategory(editingCategory.id, {
        name: newCategoryName.trim(),
        emoji: newCategoryEmoji,
        xpReward: newCategoryXP,
      });
      toast({ title: 'Categoria atualizada!' });
    } else {
      addCustomCategory({
        name: newCategoryName.trim(),
        emoji: newCategoryEmoji,
        xpReward: newCategoryXP,
      });
      toast({ title: 'Categoria criada!' });
    }
    
    setShowCategoryModal(false);
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryEmoji('⭐');
    setNewCategoryXP(10);
  };

  const openEditCategory = (category: CustomCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryEmoji(category.emoji || '⭐');
    setNewCategoryXP(category.xpReward);
    setShowCategoryModal(true);
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
              {settings.showEmojis && habit.emoji && (
                <span className="text-2xl">{habit.emoji}</span>
              )}
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
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">Histórico de Progresso</h3>
                <span className="ml-auto text-sm text-primary font-semibold">
                  {habitProgress.completed}/{habitProgress.total}
                </span>
              </div>
              
              <div className="grid grid-cols-10 gap-1">
                {progressHistory.map((day, i) => (
                  <div
                    key={day.date}
                    className={cn(
                      'w-full aspect-square rounded-sm transition-colors',
                      day.completed 
                        ? 'bg-primary' 
                        : 'bg-muted/30'
                    )}
                    title={`${new Date(day.date).toLocaleDateString('pt-BR')} - ${day.completed ? 'Concluído' : 'Não concluído'}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {progressHistory.length < 30 
                  ? `${progressHistory.length} dia${progressHistory.length > 1 ? 's' : ''} desde o início`
                  : 'Últimos 30 dias'
                }
              </p>
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

            {/* Categories (for custom categories management) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-foreground">Categorias Personalizadas</h3>
                </div>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setNewCategoryName('');
                    setNewCategoryEmoji('⭐');
                    setNewCategoryXP(10);
                    setShowCategoryModal(true);
                  }}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  + Nova
                </button>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {customCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>{cat.emoji}</span>
                      <span className="text-sm">{cat.name}</span>
                      <span className="text-xs text-muted-foreground">({cat.xpReward} XP)</span>
                    </div>
                    <button
                      onClick={() => openEditCategory(cat)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
                {customCategories.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Nenhuma categoria personalizada
                  </p>
                )}
              </div>
            </div>

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

            {/* Category Edit Modal */}
            <AnimatePresence>
              {showCategoryModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
                  onClick={() => setShowCategoryModal(false)}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-sm bg-card border border-border rounded-2xl p-4 space-y-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="font-semibold text-foreground">
                      {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                    </h3>
                    
                    <input
                      type="text"
                      placeholder="Nome da categoria"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Emoji</label>
                      <input
                        type="text"
                        value={newCategoryEmoji}
                        onChange={(e) => setNewCategoryEmoji(e.target.value)}
                        className="w-20 bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-center text-xl focus:outline-none focus:ring-1 focus:ring-primary/50"
                        maxLength={2}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">XP Padrão</label>
                      <div className="grid grid-cols-6 gap-2">
                        {XP_OPTIONS.map((xp) => (
                          <button
                            key={xp}
                            onClick={() => setNewCategoryXP(xp)}
                            className={cn(
                              'py-2 rounded-lg text-sm font-medium transition-all',
                              newCategoryXP === xp
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                            )}
                          >
                            {xp}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCategoryModal(false)}
                        className="flex-1 py-2 bg-muted/50 text-foreground rounded-xl font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveCategory}
                        className="flex-1 py-2 gradient-primary text-primary-foreground rounded-xl font-medium"
                      >
                        Salvar
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="w-full px-4 py-3 gradient-primary text-primary-foreground rounded-xl font-medium"
            >
              Salvar Alterações
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
