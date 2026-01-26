import { motion } from 'framer-motion';
import { Link2 } from 'lucide-react';
import { Goal, Habit } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { formatPercentage } from '@/utils/formatPercentage';

interface GoalSquareCardProps {
  goal: Goal;
  index: number;
  onClick?: () => void;
}

const typeLabels: Record<Goal['type'], string> = {
  weekly: 'Semanal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  semestral: 'Semestral',
  yearly: 'Anual',
};

const typeColors: Record<Goal['type'], string> = {
  weekly: 'bg-success/20 text-success border-success/30',
  monthly: 'bg-primary/20 text-primary border-primary/30',
  quarterly: 'bg-secondary/20 text-secondary border-secondary/30',
  semestral: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  yearly: 'gradient-fire text-primary-foreground',
};

export const GoalSquareCard = ({ goal, index, onClick }: GoalSquareCardProps) => {
  const { settings, goals, habits, customCategories } = useAppStore();

  const parentGoal = goal.parentGoalId 
    ? goals.find(g => g.id === goal.parentGoalId)
    : null;

  const linkedHabits = habits.filter(h => h.goalId === goal.id);

  // Get category info
  const getCategoryDisplay = () => {
    if (goal.customCategoryId) {
      const custom = customCategories.find(c => c.id === goal.customCategoryId);
      if (custom) {
        return { name: custom.name, emoji: custom.emoji };
      }
    }
    if (goal.category) {
      return { name: goal.category, emoji: null };
    }
    return null;
  };

  const categoryInfo = getCategoryDisplay();

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className="w-full aspect-square card-dark p-3 text-left card-hover flex flex-col justify-between"
    >
      {/* Top section - Emoji and Type */}
      <div className="flex items-start justify-between">
        {settings.showEmojis && goal.emoji && (
          <span className="text-2xl">{goal.emoji}</span>
        )}
        <span className={cn('text-[10px] px-2 py-0.5 rounded-full border', typeColors[goal.type])}>
          {typeLabels[goal.type]}
        </span>
      </div>
      
      {/* Middle section - Name */}
      <div className="flex-1 flex flex-col justify-center py-2">
        <h3 className="font-semibold text-sm line-clamp-2">{goal.name}</h3>
        {categoryInfo && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {categoryInfo.emoji && settings.showEmojis ? `${categoryInfo.emoji} ` : ''}{categoryInfo.name}
          </p>
        )}
      </div>
      
      {/* Bottom section - Progress and Habits */}
      <div className="space-y-2">
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 progress-bar h-2">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${goal.progress}%` }}
              transition={{ delay: index * 0.03 + 0.2 }}
            />
          </div>
          <span className="text-xs font-bold text-primary">{formatPercentage(goal.progress)}</span>
        </div>

        {/* Linked habits count */}
        {linkedHabits.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Link2 className="w-3 h-3" />
            <span>{linkedHabits.length} hábito{linkedHabits.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </motion.button>
  );
};
