import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { GoalType } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface PeriodCardProps {
  title: string;
  type: GoalType;
  period: string;
  className?: string;
}

const themeGradients: Record<string, string> = {
  fire: 'linear-gradient(135deg, hsl(32 95% 25% / 0.8), hsl(15 90% 20% / 0.6), hsl(32 70% 15% / 0.4))',
  purple: 'linear-gradient(135deg, hsl(270 80% 30% / 0.8), hsl(280 70% 25% / 0.6), hsl(260 60% 15% / 0.4))',
  emerald: 'linear-gradient(135deg, hsl(160 80% 25% / 0.8), hsl(140 70% 20% / 0.6), hsl(150 60% 15% / 0.4))',
  ocean: 'linear-gradient(135deg, hsl(200 80% 30% / 0.8), hsl(220 70% 25% / 0.6), hsl(210 60% 15% / 0.4))',
  rose: 'linear-gradient(135deg, hsl(340 80% 35% / 0.8), hsl(320 70% 30% / 0.6), hsl(330 60% 20% / 0.4))',
};

const ProgressCircle = ({ progress }: { progress: number }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg width="50" height="50" className="transform -rotate-90">
      <circle
        cx="25"
        cy="25"
        r={radius}
        stroke="hsl(var(--muted))"
        strokeWidth="4"
        fill="none"
      />
      <motion.circle
        cx="25"
        cy="25"
        r={radius}
        stroke="hsl(var(--primary))"
        strokeWidth="4"
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

export const PeriodCard = ({ title, type, period, className }: PeriodCardProps) => {
  const { goals, addGoal, updateGoal, removeGoal, settings } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);
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

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) return;
    setIsExpanded(!isExpanded);
  };

  const currentGradient = themeGradients[settings.themeColor] || themeGradients.fire;
  const isCircular = settings.progressDisplayMode === 'circular';

  return (
    <motion.div
      layout
      className={cn(
        'overflow-hidden relative group rounded-2xl cursor-pointer glass-hover',
        'bg-card/30 backdrop-blur-sm border border-border/30',
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
    >
      {/* Theme gradient background */}
      <div 
        className="absolute inset-0"
        style={{ background: currentGradient }}
      />
      
      {/* Additional overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/40 to-transparent" />

      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{period}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {isCircular ? (
              <div className="relative flex items-center justify-center">
                <ProgressCircle progress={averageProgress} />
                <span className="absolute text-xs font-bold">{averageProgress}%</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-gradient-primary">{averageProgress}%</span>
            )}
          </div>
        </div>

        {/* Linear Progress bar */}
        {!isCircular && (
          <div className="progress-bar mb-3">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${averageProgress}%` }}
            />
          </div>
        )}

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {/* Goals list */}
              {periodGoals.map((goal) => (
                <div key={goal.id} className="bg-muted/50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {settings.showEmojis && goal.emoji && (
                        <span>{goal.emoji}</span>
                      )}
                      <span className="font-medium text-sm">{goal.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeGoal(goal.id);
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={goal.progress}
                      onChange={(e) => handleProgressChange(goal.id, parseInt(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-sm font-medium w-12 text-right">{goal.progress}%</span>
                  </div>
                </div>
              ))}

              {periodGoals.length === 0 && !showAddGoal && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Nenhum objetivo definido
                </p>
              )}

              {/* Add goal form */}
              {showAddGoal ? (
                <div className="bg-muted/50 rounded-xl p-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="🎯"
                      value={newGoalEmoji}
                      onChange={(e) => setNewGoalEmoji(e.target.value)}
                      className="input-dark w-12 text-center"
                      maxLength={2}
                    />
                    <input
                      type="text"
                      placeholder="Nome do objetivo"
                      value={newGoalName}
                      onChange={(e) => setNewGoalName(e.target.value)}
                      className="input-dark flex-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAddGoal(false);
                      }}
                      className="btn-ghost flex-1 py-2 text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddGoal();
                      }}
                      className="btn-fire flex-1 py-2 text-sm"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddGoal(true);
                  }}
                  className="w-full py-2 border border-dashed border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-primary transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar objetivo
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed summary */}
        {!isExpanded && periodGoals.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {periodGoals.length} objetivo{periodGoals.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </motion.div>
  );
};
