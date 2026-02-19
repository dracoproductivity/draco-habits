import { motion } from 'framer-motion';
import { Check, Flame, Bell, Target, X, Lock } from 'lucide-react';
import { Habit } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { calculateHabitStreak } from '@/utils/calculateStreak';
import { calculateHabitProgress } from '@/utils/habitInstanceCalculator';
import { formatPercentage } from '@/utils/formatPercentage';
import { getDifficultyLabel } from '@/types';

interface HabitSquareCardProps {
  habit: Habit;
  index: number;
  onClick?: () => void;
}

// Format date in local timezone to avoid UTC one-day shift
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const HabitSquareCard = ({ habit, index, onClick }: HabitSquareCardProps) => {
  const { settings, goals, habitChecks, toggleHabitCheck, getHabitCheckForDate } = useAppStore();

  const todayStr = formatLocalDate(new Date());
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
        "w-full aspect-square glass-card p-2 text-left card-hover flex flex-col justify-between transition-all min-h-0 rounded-2xl overflow-hidden relative",
        isCompleted && !habit.vacationMode && 'opacity-70'
      )}
      style={{ maxWidth: '140px', maxHeight: '140px' }}
    >
      {/* Goal color stripe at top */}
      {linkedGoal?.color && (
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ backgroundColor: linkedGoal.color }}
        />
      )}

      {/* Vacation Mode Overlay */}
      {habit.vacationMode && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-[2px] rounded-2xl">
          <div className="flex flex-col items-center gap-1">
            <Lock className="w-5 h-5 text-emerald-400" />
            <span className="text-[9px] font-medium text-emerald-400">Férias</span>
          </div>
        </div>
      )}

      {/* Top section - Emoji and Check */}
      <div className="flex items-start justify-between gap-1">
        {settings.showEmojis && habit.emoji && (
          <span className="text-lg">{habit.emoji}</span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (habit.vacationMode) return; // Block in vacation mode
            toggleHabitCheck(habit.id, todayStr);
          }}
          disabled={habit.vacationMode}
          className={cn(
            'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0',
            isCompleted
              ? 'bg-primary border-primary'
              : 'border-muted-foreground/50 hover:border-primary',
            habit.vacationMode && 'opacity-30'
          )}
        >
          {isCompleted && (
            habit.isBadHabit ? (
              <X className="w-3 h-3 text-primary-foreground" />
            ) : (
              <Check className="w-3 h-3 text-primary-foreground" />
            )
          )}
        </button>
      </div>

      {/* Middle section - Name */}
      <div className="flex-1 flex flex-col justify-center py-1 min-h-0">
        <h3 className={cn(
          "font-semibold text-xs line-clamp-2 leading-tight",
          isCompleted && 'line-through text-muted-foreground'
        )}>
          {habit.name}
        </h3>
        {linkedGoal && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate flex items-center gap-0.5">
            <Target className="w-2.5 h-2.5" />
            {linkedGoal.name}
          </p>
        )}
      </div>

      {/* Bottom section - Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {streak > 0 && (
            <div className="flex items-center gap-0.5 text-orange-400">
              <Flame className="w-2.5 h-2.5" />
              <span className="text-[8px] font-medium">{streak}d</span>
            </div>
          )}
          {habit.notificationEnabled && (
            <Bell className="w-2.5 h-2.5 text-primary" />
          )}
        </div>
        <span className="text-[8px] font-medium text-primary">{getDifficultyLabel(habit.xpReward || 0)}</span>
      </div>
    </motion.button>
  );
};
