import React from 'react';
import { motion } from 'framer-motion';
import { Check, Plus, Bell, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Habit, Goal, HabitCheck } from '@/types';
import { calculateHabitStreak } from '@/utils/calculateStreak';

interface HabitItemProps {
  habit: Habit;
  linkedGoal?: Goal;
  check?: HabitCheck;
  showEmojis: boolean;
  onToggle: () => void;
  onIncrementMicroGoal: () => void;
  onClick: () => void;
  habitChecks: HabitCheck[];
  delay?: number;
}

const WEEK_DAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

export const HabitItem = ({
  habit,
  linkedGoal,
  check,
  showEmojis,
  onToggle,
  onIncrementMicroGoal,
  onClick,
  habitChecks,
  delay = 0,
}: HabitItemProps) => {
  const isCompleted = check?.completed ?? false;
  const hasMicroGoals = habit.hasMicroGoals && habit.microGoalsCount && habit.microGoalsCount > 1;
  const microGoalsCount = habit.microGoalsCount || 1;
  const microGoalsCompleted = check?.microGoalsCompleted || 0;
  const microProgress = hasMicroGoals ? (microGoalsCompleted / microGoalsCount) * 100 : (isCompleted ? 100 : 0);
  const streak = calculateHabitStreak(habit, habitChecks, linkedGoal);

  const handleCheckClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMicroGoals) {
      onIncrementMicroGoal();
    } else {
      onToggle();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="relative rounded-xl overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {/* Background fill animation */}
      <motion.div
        className="absolute inset-0 bg-primary/15"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: microProgress / 100 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ transformOrigin: 'left' }}
      />
      
      {/* Content */}
      <div className={cn(
        'relative flex items-center gap-3 p-3 transition-all',
        !isCompleted && !microGoalsCompleted && 'hover:bg-muted/20'
      )}>
        {/* Checkbox / Micro goals button */}
        {hasMicroGoals ? (
          <button
            onClick={handleCheckClick}
            className={cn(
              'w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all relative overflow-hidden',
              isCompleted 
                ? 'bg-primary border-primary' 
                : 'border-muted-foreground/50 hover:border-primary'
            )}
          >
            {/* Segmented progress for micro goals */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: microGoalsCount }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex-1 transition-all duration-300',
                    i < microGoalsCompleted ? 'bg-primary' : 'bg-transparent',
                    i < microGoalsCount - 1 && 'border-r border-background/30'
                  )}
                />
              ))}
            </div>
            {isCompleted ? (
              <Check className="w-4 h-4 text-primary-foreground relative z-10" />
            ) : (
              <Plus className="w-4 h-4 text-muted-foreground relative z-10" />
            )}
          </button>
        ) : (
          <button
            onClick={handleCheckClick}
            className={cn(
              'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
              isCompleted 
                ? 'bg-primary border-primary' 
                : 'border-muted-foreground/50 hover:border-primary'
            )}
          >
            {isCompleted && <Check className="w-4 h-4 text-primary-foreground" />}
          </button>
        )}

        {/* Habit info */}
        <div className="flex-1 flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            {showEmojis && habit.emoji && (
              <span className="text-lg">{habit.emoji}</span>
            )}
            <span className={cn(
              'font-medium transition-all',
              isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
            )}>
              {habit.name}
            </span>
            {hasMicroGoals && (
              <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                {microGoalsCompleted}/{microGoalsCount}
              </span>
            )}
          </div>
          {linkedGoal && (
            <span className="text-xs text-muted-foreground">
              🎯 {linkedGoal.name}
            </span>
          )}
          {habit.weekDays && habit.weekDays.length > 0 && habit.weekDays.length < 7 && (
            <span className="text-xs text-muted-foreground/70">
              {habit.weekDays.map(d => WEEK_DAYS[d]?.label).join(', ')}
            </span>
          )}
        </div>

        {/* Right side info */}
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-0.5 text-muted-foreground">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs">{streak}</span>
            </div>
          )}
          {habit.notificationEnabled && (
            <Bell className="w-3.5 h-3.5 text-primary" />
          )}
          <span className="text-xs text-muted-foreground">+{habit.xpReward} XP</span>
        </div>
      </div>
    </motion.div>
  );
};
