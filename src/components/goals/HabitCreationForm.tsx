import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Check, Repeat, Bell, Layers, Sparkles, AlertCircle, CalendarRange, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { EmojiPickerButton } from '@/components/ui/EmojiPickerButton';
import { Goal, XP_OPTIONS } from '@/types';
import { toast } from '@/hooks/use-toast';
import { XP_LIMITS, MAX_ACTIVE_HABITS, getTotalActiveHabits, getActiveHabitCountsByXP, isXPAvailable, canCreateHabit } from '@/utils/habitLimits';
import { getPeriodBoundaries } from '@/utils/habitInstanceCalculator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const WEEK_DAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

interface HabitCreationFormProps {
  parentGoal?: Goal;
  onClose: () => void;
  onCreated?: () => void;
}

export const HabitCreationForm = ({ parentGoal, onClose, onCreated }: HabitCreationFormProps) => {
  const { addHabit, habits, goals } = useAppStore();
  
  const [habitName, setHabitName] = useState('');
  const [habitEmoji, setHabitEmoji] = useState('');
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isOneTimeHabit, setIsOneTimeHabit] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<1 | 2 | 3 | 4>(1);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState('08:00');
  const [hasMicroGoals, setHasMicroGoals] = useState(false);
  const [microGoalsCount, setMicroGoalsCount] = useState(4);
  const [microGoalsNames, setMicroGoalsNames] = useState<string[]>([]);
  
  // Optional goal selection - use parentGoal if provided, otherwise allow user to select
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(parentGoal?.id || null);
  const selectedGoal = selectedGoalId ? goals.find(g => g.id === selectedGoalId) : parentGoal;
  
  const [selectedXPReward, setSelectedXPReward] = useState<number>(selectedGoal?.categoryXP || 20);
  
  // Date range state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Calculate period boundaries based on selected goal (if any)
  const periodBoundaries = useMemo(() => {
    if (!selectedGoal) return null;
    return getPeriodBoundaries(selectedGoal.type, selectedGoal.period);
  }, [selectedGoal?.type, selectedGoal?.period]);

  // Format date constraints - allow any date if no goal is linked
  const minDate = periodBoundaries ? format(periodBoundaries.start, 'yyyy-MM-dd') : '';
  const maxDate = periodBoundaries ? format(periodBoundaries.end, 'yyyy-MM-dd') : '';
  
  // Friendly date labels
  const periodLabel = periodBoundaries 
    ? `${format(periodBoundaries.start, 'd MMM yyyy', { locale: ptBR })} - ${format(periodBoundaries.end, 'd MMM yyyy', { locale: ptBR })}`
    : '';
  
  // Check if goal is linked to show period constraint info
  const hasLinkedGoal = !!selectedGoal;

  // Habit limits check
  const totalActiveHabits = getTotalActiveHabits(habits);
  const xpCounts = getActiveHabitCountsByXP(habits);
  const canAddNewHabit = canCreateHabit(habits);

  const toggleWeekDay = (day: number) => {
    if (selectedWeekDays.includes(day)) {
      setSelectedWeekDays(selectedWeekDays.filter(d => d !== day));
    } else {
      setSelectedWeekDays([...selectedWeekDays, day].sort());
    }
  };

  const handleCreateHabit = () => {
    if (!habitName.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite um nome para o hábito',
        variant: 'destructive',
      });
      return;
    }

    // Validate date range for repeating habits
    if (!isOneTimeHabit && (!startDate || !endDate)) {
      toast({
        title: 'Erro',
        description: 'Selecione a data de início e término da recorrência',
        variant: 'destructive',
      });
      return;
    }

    // Check habit limit
    if (!canAddNewHabit) {
      toast({
        title: 'Limite atingido',
        description: 'Limite de 10 hábitos atingido. Quando um de seus hábitos tiver a recorrência finalizada, você poderá criar um novo.',
        variant: 'destructive',
      });
      return;
    }

    // Check XP limit
    if (!isXPAvailable(selectedXPReward, habits)) {
      toast({
        title: 'Limite de XP atingido',
        description: `Você já atingiu o limite de hábitos com ${selectedXPReward} XP.`,
        variant: 'destructive',
      });
      return;
    }

    addHabit({
      name: habitName.trim(),
      emoji: habitEmoji || undefined,
      xpReward: selectedXPReward,
      goalId: selectedGoal?.id,
      weekDays: isOneTimeHabit ? undefined : selectedWeekDays,
      isOneTime: isOneTimeHabit,
      repeatFrequency: isOneTimeHabit ? undefined : repeatFrequency,
      notificationEnabled,
      notificationTime: notificationEnabled ? notificationTime : undefined,
      hasMicroGoals,
      microGoalsCount: hasMicroGoals ? microGoalsCount : undefined,
      microGoalsNames: hasMicroGoals && microGoalsNames.length > 0 ? microGoalsNames : undefined,
      startDate: isOneTimeHabit ? undefined : startDate,
      endDate: isOneTimeHabit ? undefined : endDate,
    });

    toast({
      title: 'Hábito criado!',
      description: selectedGoal 
        ? `"${habitName}" vinculado a "${selectedGoal.name}"`
        : `"${habitName}" criado com sucesso`,
    });

    onCreated?.();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Criar Hábito</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Goal Selection - optional linking */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Vincular a um objetivo (opcional)</span>
          </div>
          <select
            value={selectedGoalId || ''}
            onChange={(e) => {
              const newGoalId = e.target.value || null;
              setSelectedGoalId(newGoalId);
              const newGoal = newGoalId ? goals.find(g => g.id === newGoalId) : null;
              if (newGoal?.categoryXP) {
                setSelectedXPReward(newGoal.categoryXP);
              }
              // Reset dates when goal changes
              setStartDate('');
              setEndDate('');
            }}
            className="w-full bg-muted/50 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="">Sem objetivo vinculado</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.emoji && `${goal.emoji} `}{goal.name} ({goal.type} • {goal.period})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {/* Name and Emoji */}
          <div className="flex gap-2">
            <EmojiPickerButton
              value={habitEmoji}
              onChange={setHabitEmoji}
              placeholder="😊"
            />
            <input
              type="text"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              placeholder="Nome do hábito"
              className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {/* Repetition Type */}
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
          </div>

          {/* Frequency and Days */}
          {!isOneTimeHabit && (
            <>
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

              {/* Date Range for Recurrence */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarRange className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Período da recorrência</span>
                </div>
                
                {hasLinkedGoal && periodLabel && (
                  <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                    📅 Período do objetivo: {periodLabel}
                  </p>
                )}
                
                {!hasLinkedGoal && (
                  <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                    📅 Defina o período em que o hábito será repetido
                  </p>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Início</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={minDate || undefined}
                      max={endDate || maxDate || undefined}
                      className="w-full p-2 rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Término</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || minDate || undefined}
                      max={maxDate || undefined}
                      className="w-full p-2 rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Micro Goals */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Hábito com Micro Objetivos</span>
              </div>
              <button
                onClick={() => setHasMicroGoals(!hasMicroGoals)}
                className={cn(
                  'w-10 h-5 rounded-full transition-all relative',
                  hasMicroGoals ? 'bg-primary' : 'bg-muted'
                )}
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-all',
                    hasMicroGoals ? 'right-0.5' : 'left-0.5'
                  )}
                />
              </button>
            </div>
            
            {hasMicroGoals && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                  💡 Ex: Beber 2L de água, com micro objetivos de 250ml. Cada vez que você beber 250ml, marca uma parte do hábito.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Quantidade:</span>
                  <div className="flex gap-1">
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => {
                          setMicroGoalsCount(count);
                          // Resize names array
                          setMicroGoalsNames(prev => {
                            const newNames = [...prev];
                            while (newNames.length < count) newNames.push('');
                            return newNames.slice(0, count);
                          });
                        }}
                        className={cn(
                          'w-7 h-7 rounded-lg text-xs font-medium transition-all',
                          microGoalsCount === count
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Micro goals names */}
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Nomes (opcional):</span>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: microGoalsCount }).map((_, i) => (
                      <input
                        key={i}
                        type="text"
                        placeholder={`Micro ${i + 1}`}
                        value={microGoalsNames[i] || ''}
                        onChange={(e) => {
                          const newNames = [...microGoalsNames];
                          newNames[i] = e.target.value;
                          setMicroGoalsNames(newNames);
                        }}
                        className="bg-muted/30 border border-border/50 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notification */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Lembrete</span>
              </div>
              <button
                onClick={() => setNotificationEnabled(!notificationEnabled)}
                className={cn(
                  'w-10 h-5 rounded-full transition-all relative',
                  notificationEnabled ? 'bg-primary' : 'bg-muted'
                )}
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-all',
                    notificationEnabled ? 'right-0.5' : 'left-0.5'
                  )}
                />
              </button>
            </div>
            
            {notificationEnabled && (
              <input
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
                className="w-full p-2 rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:border-primary text-sm"
              />
            )}
          </div>

          {/* XP Reward Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">XP por conclusão</span>
            </div>
            
            <div className="grid grid-cols-6 gap-1">
              {XP_OPTIONS.map((xp) => {
                const limit = XP_LIMITS[xp];
                const currentCount = xpCounts[xp] || 0;
                const isAtLimit = limit !== undefined && currentCount >= limit;
                const isSelected = selectedXPReward === xp;
                
                return (
                  <div key={xp} className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => !isAtLimit && setSelectedXPReward(xp)}
                      disabled={isAtLimit}
                      className={cn(
                        'w-full py-2 rounded-lg text-xs font-medium transition-all',
                        isAtLimit
                          ? 'bg-destructive/20 text-destructive border border-destructive/30 cursor-not-allowed'
                          : isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/50'
                      )}
                    >
                      {xp}
                    </button>
                    {limit !== undefined && (
                      <span className={cn(
                        'text-[9px] mt-0.5',
                        isAtLimit ? 'text-destructive' : 'text-muted-foreground'
                      )}>
                        {isAtLimit ? 'Limite' : `${currentCount}/${limit}`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Habit limit warning */}
          {!canAddNewHabit && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-xl border border-destructive/30">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-xs text-destructive">
                Limite de 10 hábitos atingido. Quando um de seus hábitos tiver a recorrência finalizada, você poderá criar um novo.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-muted/50 text-foreground rounded-xl font-semibold hover:bg-muted/70 transition-colors"
            >
              Pular
            </button>
            <button
              onClick={handleCreateHabit}
              disabled={!habitName.trim() || !canAddNewHabit || !isXPAvailable(selectedXPReward, habits)}
              className="flex-1 py-3 gradient-fire text-primary-foreground rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Criar Hábito
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
