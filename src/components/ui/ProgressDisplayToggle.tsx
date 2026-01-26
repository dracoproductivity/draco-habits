import { Circle, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressDisplayToggleProps {
  mode: 'linear' | 'circular';
  onToggle: () => void;
  className?: string;
}

export const ProgressDisplayToggle = ({ mode, onToggle, className }: ProgressDisplayToggleProps) => {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/20 transition-all',
        'flex items-center justify-center',
        className
      )}
      title={mode === 'linear' ? 'Mudar para circular' : 'Mudar para linear'}
    >
      {mode === 'linear' ? (
        <Circle className="w-3.5 h-3.5 text-muted-foreground" />
      ) : (
        <Minus className="w-3.5 h-3.5 text-muted-foreground" />
      )}
    </button>
  );
};
