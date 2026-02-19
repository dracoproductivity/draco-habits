import React from 'react';
import { motion } from 'framer-motion';
import { Check, Plus, Bell, Flame, X, Lock, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Habit, Goal, HabitCheck } from '@/types';
import { calculateHabitStreak } from '@/utils/calculateStreak';
import { getDifficultyLabel } from '@/types';
import { useResponsive } from '@/hooks/useResponsive';

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
  onBadHabitComplete?: () => void;
  onToggleDracoSave?: () => void;
  dracoSaves?: number;
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
  onBadHabitComplete,
  onToggleDracoSave,
  dracoSaves = 0,
  onToggleDracoSave,
  dracoSaves = 0,
  streakColor,
}: HabitItemProps & { streakColor?: string }) => {
  const { isMobile } = useResponsive();
  const isCompleted = check?.completed ?? false;
  // ... (rest of logic)

  return (
    <motion.div
      // ...
      <div className={cn(
        'relative flex items-center transition-all flex-1 min-w-0',
        isMobile ? 'p-2.5 gap-2' : 'p-3 gap-2.5', // Increased padding slightly
        !isCompleted && !microGoalsCompleted && 'hover:bg-muted/20'
      )}>
      {/* ... */}

      {/* Habit info */}
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* ... */}
          <span className={cn(
            'font-medium transition-all truncate',
            isMobile ? 'text-sm' : 'text-base', // Increased text size
            isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
          )}>
            {habit.name}
          </span>
          {/* ... */}
        </div>
        {/* ... */}
      </div>

      {/* Right side info */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {streak > 0 && (
          <div className="flex items-center gap-0.5 text-muted-foreground">
            <Flame className={cn("w-3.5 h-3.5", isMobile ? "w-3.5 h-3.5" : "w-4 h-4")} style={{ color: streakColor || '#fb923c' }} />
            <span className="text-xs" style={{ color: streakColor || '#fb923c' }}>{streak}</span>
          </div>
        )}
        {/* ... */}
      </div>
    </div>
    </motion.div >
  );
};
{
  habit.notificationEnabled && (
    <Bell className={cn("text-primary", isMobile ? "w-3 h-3" : "w-3.5 h-3.5")} />
  )
}
<span className="text-[10px] text-muted-foreground">{getDifficultyLabel(habit.xpReward || 0)}</span>
{/* Draco Save button */ }
{
  !habit.vacationMode && !isCompleted && (
    <button
      onClick={handleDracoSaveClick}
      disabled={!isDracoSaveUsed && dracoSaves < 20}
      className={cn(
        'p-1 rounded-md transition-all',
        isDracoSaveUsed
          ? 'text-primary'
          : dracoSaves >= 20
            ? 'text-muted-foreground/40 hover:text-primary/60'
            : 'text-muted-foreground/20 cursor-not-allowed'
      )}
      title={isDracoSaveUsed ? 'Draco Save ativo (clique para remover)' : dracoSaves >= 20 ? 'Usar Draco Save (-20)' : `Saldo insuficiente (${dracoSaves}/20)`}
    >
      <Heart className={cn(isDracoSaveUsed && 'fill-current', isMobile ? "w-3 h-3" : "w-3.5 h-3.5")} />
    </button>
  )
}
        </div >
      </div >
    </motion.div >
  );
};
