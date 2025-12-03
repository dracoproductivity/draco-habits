import { motion } from 'framer-motion';
import { Goal } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

interface GoalCardProps {
  goal: Goal;
  index: number;
  onClick?: () => void;
}

const typeLabels: Record<Goal['type'], string> = {
  weekly: 'Semanal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

const typeColors: Record<Goal['type'], string> = {
  weekly: 'bg-success/20 text-success',
  monthly: 'bg-primary/20 text-primary',
  quarterly: 'bg-secondary/20 text-secondary',
  yearly: 'gradient-fire text-primary-foreground',
};

export const GoalCard = ({ goal, index, onClick }: GoalCardProps) => {
  const { settings } = useAppStore();

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="w-full card-dark p-4 text-left card-hover"
    >
      <div className="flex items-start gap-3">
        {settings.showEmojis && goal.emoji && (
          <span className="text-2xl">{goal.emoji}</span>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{goal.name}</h3>
            <span className={cn('text-xs px-2 py-0.5 rounded-full', typeColors[goal.type])}>
              {typeLabels[goal.type]}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">{goal.period}</p>
          
          <div className="flex items-center gap-3">
            <div className="flex-1 progress-bar">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${goal.progress}%` }}
                transition={{ delay: index * 0.05 + 0.2 }}
              />
            </div>
            <span className="text-sm font-medium">{goal.progress}%</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
};
