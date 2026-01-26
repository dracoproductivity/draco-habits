import { motion } from 'framer-motion';
import { Check, Flame, Bell, Target } from 'lucide-react';
import { Habit } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { calculateHabitStreak } from '@/utils/calculateStreak';
import { calculateHabitProgress } from '@/utils/habitInstanceCalculator';
import { formatPercentage } from '@/utils/formatPercentage';

interface HabitSquareCardProps {
  habit: Habit;
  index: number;
  onClick?: () => void;
}

export const HabitSquareCard = ({ habit, index, onClick }: HabitSquareCardProps) => {
  const { settings, goals, habitChecks, toggleHabitCheck, getHabitCheckForDate } = useAppStore();

  const todayStr = new Date().toISOString().split('T')[0];
  const check = getHabitCheckForDate(habit.id, todayStr);
  const isCompleted = check?.completed ?? false;

  const linkedGoal = habit.goalId ? goals.find(g => g.id === habit.goalId) : null;
  const streak = calculateHabitStreak(habit, habitChecks, linkedGoal);
  const progress = calculateHabitProgress(habit, linkedGoal, habitChecks);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className={cn(
        "w-full aspect-square card-dark p-3 text-left card-hover flex flex-col justify-between transition-all",
        isCompleted && 'opacity-70'
      )}
    >
      {/* Top section - Emoji and Check */}
      <div className="flex items-start justify-between">
        {settings.showEmojis && habit.emoji && (
          <span className="text-2xl">{habit.emoji}</span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleHabitCheck(habit.id, todayStr);
          }}
          className={cn(
            'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0',
            isCompleted 
              ? 'bg-primary border-primary' 
              : 'border-muted-foreground/50 hover:border-primary'
          )}
        >
          {isCompleted && <Check className="w-4 h-4 text-primary-foreground" />}
        </button>
      </div>
      
      {/* Middle section - Name */}
      <div className="flex-1 flex flex-col justify-center py-2">
        <h3 className={cn(
          "font-semibold text-sm line-clamp-2",
          isCompleted && 'line-through text-muted-foreground'
        )}>
          {habit.name}
        </h3>
        {linkedGoal && (
          <p className="text-xs text-muted-foreground mt-1 truncate flex items-center gap-1">
            <Target className="w-3 h-3" />
            {linkedGoal.name}
          </p>
        )}
      </div>
      
      {/* Bottom section - Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1 text-orange-400">
              <Flame className="w-3 h-3" />
              <span className="text-[10px] font-medium">{streak}d</span>
            </div>
          )}
          {habit.notificationEnabled && (
            <Bell className="w-3 h-3 text-primary" />
          )}
        </div>
        <span className="text-[10px] font-medium text-primary">+{habit.xpReward} XP</span>
      </div>
    </motion.button>
  );
};
