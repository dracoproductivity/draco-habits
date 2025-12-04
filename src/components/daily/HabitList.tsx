import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Check, Plus, X, ChevronLeft, ChevronRight, Bell, Target } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { GoalType } from '@/types';

const CircularProgress = ({ value, label, delay = 0 }: { value: number; label: string; delay?: number }) => {
  const circumference = 2 * Math.PI * 24;
  const offset = circumference - (value / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="flex flex-col items-center"
    >
      <div className="relative w-14 h-14">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="hsl(var(--muted) / 0.3)"
            strokeWidth="3"
          />
          <motion.circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.1 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-foreground">{value}%</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground mt-1">{label}</span>
    </motion.div>
  );
};

const LinearProgress = ({ value, label, delay = 0 }: { value: number; label: string; delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex flex-col gap-1 min-w-[80px]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-xs font-bold text-foreground">{value}%</span>
      </div>
      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
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
    getWeeklyProgress
  } = useAppStore();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showGoalCreation, setShowGoalCreation] = useState(false);
  const [goalCreationStep, setGoalCreationStep] = useState<GoalType>('yearly');
  const [newGoalName, setNewGoalName] = useState('');
  const [createdGoalIds, setCreatedGoalIds] = useState<Record<GoalType, string>>({} as Record<GoalType, string>);
  
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
    });
    setNewHabitName('');
    setNewHabitEmoji('');
    setSelectedGoalId(null);
    setShowAddForm(false);
    toast({
      title: 'Hábito adicionado!',
      description: `"${newHabitName}" foi adicionado à sua lista`,
    });
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
      emoji: newHabitEmoji || undefined,
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
      toast({ title: 'Objetivos criados!', description: 'Agora você pode adicionar o hábito' });
    }
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

  const getStepLabel = (step: GoalType) => {
    const labels: Record<GoalType, string> = {
      yearly: 'Anual',
      quarterly: 'Trimestral',
      monthly: 'Mensal',
      weekly: 'Semanal',
    };
    return labels[step];
  };

  const toggleHabitNotification = (habitId: string, enabled: boolean, time?: string) => {
    updateHabit(habitId, { 
      notificationEnabled: enabled, 
      notificationTime: time || '09:00' 
    });
    toast({
      title: enabled ? 'Notificação ativada' : 'Notificação desativada',
      description: enabled ? `Você será lembrado às ${time || '09:00'}` : 'Lembrete removido',
    });
  };

  const isCircular = settings.progressDisplayMode === 'circular';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-4">
        {/* Habit list section */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-foreground text-lg">Hábitos do dia</h3>
              {/* Day navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigateDay(-1)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-muted-foreground min-w-[70px] text-center">{formatViewDate()}</span>
                <button
                  onClick={() => navigateDay(1)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
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
                    
                    {/* Goal selection */}
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

                    <button
                      onClick={handleAddHabit}
                      className="w-full px-4 py-2 gradient-primary text-primary-foreground rounded-xl font-medium text-sm"
                    >
                      Adicionar hábito
                    </button>
                  </>
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
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div 
            className="space-y-2"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDrag}
          >
            {habits.map((habit, index) => {
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
                    'flex items-center gap-3 p-3 rounded-xl transition-all group',
                    isCompleted ? 'opacity-70' : 'hover:bg-muted/20'
                  )}
                >
                  <button
                    onClick={() => toggleHabitCheck(habit.id, viewDateStr)}
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
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Notification toggle */}
                    <button
                      onClick={() => toggleHabitNotification(
                        habit.id, 
                        !habit.notificationEnabled,
                        habit.notificationTime
                      )}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        habit.notificationEnabled 
                          ? 'text-primary bg-primary/10' 
                          : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted/30'
                      )}
                      title={habit.notificationEnabled ? `Lembrete às ${habit.notificationTime}` : 'Ativar lembrete'}
                    >
                      <Bell className="w-4 h-4" />
                    </button>

                    {habit.notificationEnabled && (
                      <input
                        type="time"
                        value={habit.notificationTime || '09:00'}
                        onChange={(e) => updateHabit(habit.id, { notificationTime: e.target.value })}
                        className="text-xs bg-transparent text-muted-foreground w-16"
                      />
                    )}

                    <span className="text-xs text-muted-foreground">+{habit.xpReward} XP</span>

                    <button
                      onClick={() => removeHabit(habit.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {habits.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum hábito cadastrado</p>
                <p className="text-sm">Clique no + para adicionar</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Progress indicators on the right side */}
        <div className={cn(
          "flex flex-col gap-3 pt-10",
          isCircular ? "items-center" : "min-w-[90px]"
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
    </motion.div>
  );
};