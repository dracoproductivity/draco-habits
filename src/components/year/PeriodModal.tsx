import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { GoalType } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { EmojiPickerButton } from '@/components/ui/EmojiPickerButton';
import { calculateHierarchicalPeriodProgress } from '@/utils/habitInstanceCalculator';
import { formatPercentage, calculateRawPercentage } from '@/utils/formatPercentage';

interface PeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  type: GoalType;
  period: string;
  quarterMonths?: string[];
}

const ProgressCircle = ({ progress, size = 60 }: { progress: number; size?: number }) => {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="hsl(var(--muted))"
        strokeWidth="5"
        fill="none"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="hsl(var(--primary))"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        style={{ strokeDasharray: circumference }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </svg>
  );
};

export const PeriodModal = ({ isOpen, onClose, title, subtitle, type, period, quarterMonths }: PeriodModalProps) => {
  const { goals, addGoal, updateGoal, removeGoal, settings, habits, habitChecks } = useAppStore();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalEmoji, setNewGoalEmoji] = useState('');
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);

  const periodGoals = goals.filter((g) => g.type === type && g.period === period);
  
  // Use hierarchical X/N calculation
  const { completed, total } = calculateHierarchicalPeriodProgress(
    type,
    period,
    habits,
    goals,
    habitChecks
  );
  const averageProgress = calculateRawPercentage(completed, total);
  const formattedProgress = formatPercentage(averageProgress);

  // Extract year from period
  const extractYear = () => {
    const yearMatch = period.match(/\d{4}/);
    return yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
  };
  const displayYear = extractYear();

  // Get monthly goals for a specific month
  const getMonthlyGoals = (monthName: string) => {
    const monthPeriod = `${monthName} ${displayYear}`;
    return goals.filter((g) => g.type === 'monthly' && g.period === monthPeriod);
  };

  const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Check if a month has started or is past
  const getMonthStatus = (monthName: string): 'started' | 'not_started' | 'past' => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    if (displayYear > currentYear) return 'not_started';
    if (displayYear < currentYear) return 'past';
    
    const monthIndex = MONTH_NAMES.indexOf(monthName);
    if (monthIndex !== -1) {
      if (monthIndex < currentMonth) return 'past';
      if (monthIndex === currentMonth) return 'started';
      return 'not_started';
    }
    return 'started';
  };

  // Calculate monthly progress using X/N hierarchical method
  const getMonthProgress = (monthName: string) => {
    const monthPeriod = `${monthName} ${displayYear}`;
    const monthGoals = getMonthlyGoals(monthName);
    const status = getMonthStatus(monthName);
    
    const { completed: monthCompleted, total: monthTotal } = calculateHierarchicalPeriodProgress(
      'monthly',
      monthPeriod,
      habits,
      goals,
      habitChecks
    );
    
    const progress = calculateRawPercentage(monthCompleted, monthTotal);
    const formatted = formatPercentage(progress);
    
    return { 
      progress,
      formatted,
      status,
      completed: monthCompleted,
      total: monthTotal
    };
  };

  const toggleMonthExpanded = (month: string) => {
    if (expandedMonths.includes(month)) {
      setExpandedMonths(expandedMonths.filter(m => m !== month));
    } else {
      setExpandedMonths([...expandedMonths, month]);
    }
  };

  const handleAddGoal = () => {
    if (!newGoalName.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite um nome para o objetivo',
        variant: 'destructive',
      });
      return;
    }

    addGoal({
      name: newGoalName.trim(),
      emoji: newGoalEmoji || undefined,
      type,
      period,
      progress: 0,
    });

    setNewGoalName('');
    setNewGoalEmoji('');
    setShowAddGoal(false);
    toast({
      title: 'Objetivo adicionado!',
      description: `"${newGoalName}" foi adicionado`,
    });
  };

  const handleProgressChange = (goalId: string, newProgress: number) => {
    updateGoal(goalId, { progress: Math.min(100, Math.max(0, newProgress)) });
  };

  const isCircular = settings.progressDisplayMode === 'circular';

  return (
    <AnimatePresence>
      {isOpen && (
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
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl max-h-[80vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{title}</h2>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                )}
                <p className="text-sm text-primary mt-1">{period}</p>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-muted/20 rounded-xl">
              {isCircular ? (
                <div className="relative flex items-center justify-center">
                  <ProgressCircle progress={averageProgress} />
                  <span className="absolute text-sm font-bold">{formattedProgress}</span>
                </div>
              ) : (
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Progresso ({completed}/{total})</span>
                    <span className="text-lg font-bold text-gradient-primary">{formattedProgress}</span>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${averageProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Monthly Progress for Quarters */}
            {quarterMonths && quarterMonths.length > 0 && (
              <div className="space-y-3 mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground">Progresso Mensal</h3>
              {quarterMonths.map((month) => {
                  const { progress: monthProgress, formatted: monthFormatted, status: monthStatus, completed: mCompleted, total: mTotal } = getMonthProgress(month);
                  const monthGoals = getMonthlyGoals(month);
                  const isExpanded = expandedMonths.includes(month);

                  return (
                    <div key={month} className="bg-muted/30 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleMonthExpanded(month)}
                        className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">{month}</span>
                          <span className="text-xs text-muted-foreground">
                            {mCompleted}/{mTotal} hábitos
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {monthStatus === 'past' ? (
                            <span className="text-xs text-muted-foreground/70">Passado</span>
                          ) : monthStatus === 'not_started' && monthProgress === 0 ? (
                            <span className="text-xs text-muted-foreground">Não iniciado</span>
                          ) : (
                            <>
                              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${monthProgress}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-primary w-12 text-right">{monthFormatted}</span>
                            </>
                          )}
                          {(monthGoals.length > 0 || mTotal > 0) && (
                            isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                      
                      {/* Monthly Goals Expanded */}
                      <AnimatePresence>
                        {isExpanded && monthGoals.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border/30"
                          >
                            <div className="p-3 space-y-2">
                              {monthGoals.map((goal) => (
                                <div key={goal.id} className="flex items-center gap-2 text-sm">
                                  {settings.showEmojis && goal.emoji && (
                                    <span className="text-xs">{goal.emoji}</span>
                                  )}
                                  <span className="text-muted-foreground flex-1 truncate">{goal.name}</span>
                                  <div className="w-12 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary/70 rounded-full"
                                      style={{ width: `${goal.progress}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-primary w-8 text-right">{formatPercentage(goal.progress)}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Goals for Monthly - Show monthly goals */}
            {type === 'monthly' && (
              <div className="space-y-3 mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Objetivos do Mês</h3>
                {periodGoals.length > 0 ? (
                  periodGoals.map((goal) => (
                    <div key={goal.id} className="bg-muted/30 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {settings.showEmojis && goal.emoji && (
                            <span>{goal.emoji}</span>
                          )}
                          <span className="font-medium text-sm">{goal.name}</span>
                        </div>
                        <button
                          onClick={() => removeGoal(goal.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: 'var(--gradient-progress)' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${goal.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{formatPercentage(goal.progress)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  !showAddGoal && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      Nenhum objetivo mensal definido
                    </p>
                  )
                )}
              </div>
            )}

            {/* Quarterly Goals - Goals specific to the quarter */}
            {type === 'quarterly' && (
              <div className="space-y-3 mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Objetivos Trimestrais</h3>
                {periodGoals.length > 0 ? (
                  periodGoals.map((goal) => (
                    <div key={goal.id} className="bg-muted/30 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {settings.showEmojis && goal.emoji && (
                            <span>{goal.emoji}</span>
                          )}
                          <span className="font-medium text-sm">{goal.name}</span>
                        </div>
                        <button
                          onClick={() => removeGoal(goal.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: 'var(--gradient-progress)' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${goal.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{formatPercentage(goal.progress)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  !showAddGoal && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      Nenhum objetivo trimestral definido
                    </p>
                  )
                )}
              </div>
            )}

            {/* Goals list for weekly and yearly */}
            {(type === 'weekly' || type === 'yearly') && (
              <div className="space-y-3 mb-4">
                {periodGoals.map((goal) => (
                  <div key={goal.id} className="bg-muted/30 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {settings.showEmojis && goal.emoji && (
                          <span>{goal.emoji}</span>
                        )}
                        <span className="font-medium text-sm">{goal.name}</span>
                      </div>
                      <button
                        onClick={() => removeGoal(goal.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: 'var(--gradient-progress)' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${goal.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{formatPercentage(goal.progress)}</span>
                    </div>
                  </div>
                ))}

                {periodGoals.length === 0 && !showAddGoal && (
                  <p className="text-center text-sm text-muted-foreground py-6">
                    Nenhum objetivo definido
                  </p>
                )}
              </div>
            )}

            {/* Add goal form */}
            {showAddGoal ? (
              <div className="bg-muted/30 rounded-xl p-3 space-y-3">
                <div className="flex gap-2">
                  <EmojiPickerButton
                    value={newGoalEmoji}
                    onChange={setNewGoalEmoji}
                  />
                  <input
                    type="text"
                    placeholder="Nome do objetivo"
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddGoal(false)}
                    className="flex-1 py-2 text-sm border border-border rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddGoal}
                    className="flex-1 py-2 text-sm gradient-primary text-primary-foreground rounded-xl"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddGoal(true)}
                className="w-full py-3 border border-dashed border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-primary transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar objetivo
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};