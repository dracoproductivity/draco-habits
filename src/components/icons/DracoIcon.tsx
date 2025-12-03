import { cn } from '@/lib/utils';

interface DracoIconProps {
  className?: string;
  level?: number;
}

export const DracoIcon = ({ className, level = 1 }: DracoIconProps) => {
  // Different dragon appearances based on level
  const getColor = () => {
    if (level < 5) return 'text-primary';
    if (level < 10) return 'text-amber-400';
    if (level < 20) return 'text-orange-500';
    if (level < 50) return 'text-red-500';
    return 'text-purple-500';
  };

  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('w-full h-full', getColor())}
      >
        {/* Dragon body */}
        <ellipse cx="50" cy="60" rx="25" ry="20" fill="currentColor" />
        
        {/* Dragon head */}
        <circle cx="50" cy="35" r="18" fill="currentColor" />
        
        {/* Snout */}
        <ellipse cx="50" cy="42" rx="8" ry="6" fill="currentColor" className="opacity-80" />
        
        {/* Eyes */}
        <circle cx="42" cy="32" r="4" fill="hsl(var(--background))" />
        <circle cx="58" cy="32" r="4" fill="hsl(var(--background))" />
        <circle cx="43" cy="31" r="2" fill="hsl(var(--foreground))" />
        <circle cx="59" cy="31" r="2" fill="hsl(var(--foreground))" />
        
        {/* Nostrils */}
        <circle cx="46" cy="43" r="1.5" fill="hsl(var(--background))" />
        <circle cx="54" cy="43" r="1.5" fill="hsl(var(--background))" />
        
        {/* Horns */}
        <path
          d="M35 25 L30 10 L38 22"
          fill="currentColor"
          className="opacity-90"
        />
        <path
          d="M65 25 L70 10 L62 22"
          fill="currentColor"
          className="opacity-90"
        />
        
        {/* Wings */}
        <path
          d="M25 55 Q10 40 20 25 Q25 35 30 45 Q28 50 25 55"
          fill="currentColor"
          className="opacity-70"
        />
        <path
          d="M75 55 Q90 40 80 25 Q75 35 70 45 Q72 50 75 55"
          fill="currentColor"
          className="opacity-70"
        />
        
        {/* Belly */}
        <ellipse cx="50" cy="65" rx="15" ry="12" fill="currentColor" className="opacity-60" />
        
        {/* Tail */}
        <path
          d="M70 70 Q85 75 90 65 Q88 72 80 73 Q75 73 70 70"
          fill="currentColor"
        />
        
        {/* Feet */}
        <ellipse cx="38" cy="78" rx="6" ry="4" fill="currentColor" />
        <ellipse cx="62" cy="78" rx="6" ry="4" fill="currentColor" />
        
        {/* Smile */}
        <path
          d="M44 47 Q50 52 56 47"
          stroke="hsl(var(--background))"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      
      {/* Level indicator glow */}
      {level >= 10 && (
        <div className="absolute inset-0 animate-pulse-glow rounded-full opacity-50" />
      )}
    </div>
  );
};
