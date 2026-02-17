import { motion } from 'framer-motion';
import { Link2, Check, X } from 'lucide-react';
import { Goal, DEFAULT_CATEGORIES } from '@/types';
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
  const { settings, habits, customCategories } = useAppStore();

  const linkedHabits = habits.filter(h => h.goalId === goal.id && !h.archived);

  // Get category info with proper label
  const getCategoryDisplay = () => {
    if (goal.customCategoryId) {
      const custom = customCategories.find(c => c.id === goal.customCategoryId);
      if (custom) {
        return { name: custom.name, emoji: custom.emoji };
      }
    }
    if (goal.category) {
      const defaultCat = DEFAULT_CATEGORIES.find(c => c.id === goal.category);
      if (defaultCat) {
        return { name: defaultCat.name, emoji: defaultCat.emoji };
      }
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
      className="w-full aspect-square glass-card p-2 text-left card-hover flex flex-col justify-between min-h-0 rounded-2xl"
      style={{ maxWidth: '140px', maxHeight: '140px' }}
    >
      {/* Top section - Emoji and Type */}
      <div className="flex items-start justify-between gap-1">
        {settings.showEmojis && goal.emoji && (
          <span className="text-lg">{goal.emoji}</span>
        )}
        <span className={cn('text-[8px] px-1.5 py-0.5 rounded-full border whitespace-nowrap', typeColors[goal.type])}>
          {typeLabels[goal.type]}
        </span>
      </div>
      
      {/* Middle section - Name */}
      <div className="flex-1 flex flex-col justify-center py-1 min-h-0">
        <h3 className="font-semibold text-xs line-clamp-2 leading-tight">{goal.name}</h3>
        {categoryInfo && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {categoryInfo.emoji && settings.showEmojis ? `${categoryInfo.emoji} ` : ''}{categoryInfo.name}
          </p>
        )}
      </div>
      
      {/* Bottom section - Progress and Status */}
      <div className="space-y-1">
        {/* Progress bar */}
        <div className="flex items-center gap-1">
          <div className="flex-1 progress-bar h-1.5">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${goal.progress}%` }}
              transition={{ delay: index * 0.03 + 0.2 }}
            />
          </div>
          <span className="text-[10px] font-bold text-primary">{formatPercentage(goal.progress)}</span>
        </div>

        {/* Completion Status */}
        {goal.completionStatus && (
          <div className={cn(
            'flex items-center gap-1 text-[9px] py-1 px-1.5 rounded-lg',
            goal.completionStatus === 'completed' 
              ? 'bg-success/20 text-success' 
              : 'bg-destructive/20 text-destructive'
          )}>
            {goal.completionStatus === 'completed' ? (
              <>
                <Check className="w-3 h-3" />
                <span className="truncate">Consegui!</span>
              </>
            ) : (
              <>
                <X className="w-3 h-3" />
                <span className="truncate">Evoluindo...</span>
              </>
            )}
          </div>
        )}

        {/* Linked habits count - only show if no completion status */}
        {!goal.completionStatus && linkedHabits.length > 0 && (
          <div className="flex items-center gap-0.5 text-[8px] text-muted-foreground">
            <Link2 className="w-2.5 h-2.5" />
            <span>{linkedHabits.length} hábito{linkedHabits.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </motion.button>
  );
};
