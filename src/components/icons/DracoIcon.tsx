import { cn } from '@/lib/utils';
import dracoLogo from '@/assets/draco-logo.jpeg';

interface DracoIconProps {
  className?: string;
  level?: number;
}

export const DracoIcon = ({ className, level = 1 }: DracoIconProps) => {
  // Glow effect based on level
  const getGlow = () => {
    if (level < 5) return '';
    if (level < 10) return 'shadow-[0_0_15px_hsl(var(--primary)/0.4)]';
    if (level < 20) return 'shadow-[0_0_20px_hsl(var(--primary)/0.5)]';
    if (level < 50) return 'shadow-[0_0_25px_hsl(var(--primary)/0.6)]';
    return 'shadow-[0_0_30px_hsl(var(--primary)/0.7)]';
  };

  return (
    <div className={cn('relative', className)}>
      <img
        src={dracoLogo}
        alt={`Draco Level ${level}`}
        className={cn(
          'w-full h-full object-contain rounded-xl transition-all duration-300',
          getGlow()
        )}
      />
      
      {/* Level indicator glow */}
      {level >= 10 && (
        <div className="absolute inset-0 animate-pulse rounded-xl bg-primary/10" />
      )}
    </div>
  );
};
