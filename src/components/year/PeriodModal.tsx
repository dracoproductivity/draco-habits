import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { GoalType } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface PeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  type: GoalType;
  period: string;
}

const ProgressCircle = ({ progress }: { progress: number }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg width="60" height="60" className="transform -rotate-90">
      <circle
        cx="30"
        cy="30"
        r={radius}
        stroke="hsl(var(--muted))"
        strokeWidth="5"
        fill="none"
      />
      <motion.circle
        cx="30"
        cy="30"
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

export const PeriodModal = ({ isOpen, onClose, title, subtitle, type, period }: PeriodModalProps) => {
  const { goals, addGoal, updateGoal, removeGoal, settings } = useAppStore();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalEmoji, setNewGoalEmoji] = useState('');

  const periodGoals = goals.filter((g) => g.type === type && g.period === period);
  const averageProgress = periodGoals.length > 0
    ? Math.round(periodGoals.reduce((acc, g) => acc + g.progress, 0) / periodGoals.length)
    : 0;

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
                  <span className="absolute text-sm font-bold">{averageProgress}%</span>
                </div>
              ) : (
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Progresso médio</span>
                    <span className="text-lg font-bold text-gradient-primary">{averageProgress}%</span>
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

            {/* Goals list */}
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
                    <span className="text-sm font-medium w-12 text-right">{goal.progress}%</span>
                  </div>
                </div>
              ))}

              {periodGoals.length === 0 && !showAddGoal && (
                <p className="text-center text-sm text-muted-foreground py-6">
                  Nenhum objetivo definido
                </p>
              )}
            </div>

            {/* Add goal form */}
            {showAddGoal ? (
              <div className="bg-muted/30 rounded-xl p-3 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="🎯"
                    value={newGoalEmoji}
                    onChange={(e) => setNewGoalEmoji(e.target.value)}
                    className="w-12 bg-muted/50 border border-border/50 rounded-xl px-3 py-2 text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    maxLength={2}
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
