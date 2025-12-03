import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface XPBarProps {
  currentXP: number;
  xpToNextLevel: number;
  level: number;
  showLabel?: boolean;
  className?: string;
}

export const XPBar = ({ currentXP, xpToNextLevel, level, showLabel = true, className }: XPBarProps) => {
  const progress = (currentXP / xpToNextLevel) * 100;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Nível {level}</span>
          <span className="text-muted-foreground">
            {currentXP} / {xpToNextLevel} XP
          </span>
        </div>
      )}
      <div className="progress-bar h-2">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};
