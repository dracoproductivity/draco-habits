import { cn } from '@/lib/utils';

// Import all dragon images
import dracoWhite from '@/assets/dragons/draco-white.jpg';
import dracoGray from '@/assets/dragons/draco-gray.jpg';
import dracoLavender from '@/assets/dragons/draco-lavender.jpg';
import dracoOrange from '@/assets/dragons/draco-orange.jpg';
import dracoPink from '@/assets/dragons/draco-pink.jpg';
import dracoPurple from '@/assets/dragons/draco-purple.jpg';
import dracoRed from '@/assets/dragons/draco-red.jpg';
import dracoBlack from '@/assets/dragons/draco-black.jpg';
import dracoSilver from '@/assets/dragons/draco-silver.jpg';
import dracoGold from '@/assets/dragons/draco-gold.jpg';
import dracoRainbow from '@/assets/dragons/draco-rainbow.jpg';
import dracoGreen from '@/assets/dragons/draco-green.jpg';
import dracoBlue from '@/assets/dragons/draco-blue.jpg';

export type DracoColorType = 
  | 'white' 
  | 'gray' 
  | 'lavender' 
  | 'orange' 
  | 'pink' 
  | 'purple' 
  | 'red' 
  | 'black' 
  | 'silver' 
  | 'gold'
  | 'rainbow'
  | 'green'
  | 'blue'
  // Legacy colors - map to new ones
  | 'yellow' 
  | 'neutral' 
  | 'lilac' 
  | 'mint';

export const DRACO_IMAGES: Record<string, string> = {
  white: dracoWhite,
  gray: dracoGray,
  lavender: dracoLavender,
  orange: dracoOrange,
  pink: dracoPink,
  purple: dracoPurple,
  red: dracoRed,
  black: dracoBlack,
  silver: dracoSilver,
  gold: dracoGold,
  rainbow: dracoRainbow,
  green: dracoGreen,
  blue: dracoBlue,
  // Legacy mappings
  yellow: dracoGold,
  neutral: dracoWhite,
  lilac: dracoLavender,
  mint: dracoGreen,
};

interface DracoIconProps {
  className?: string;
  level?: number;
  color?: string;
}

export const DracoIcon = ({ className, level = 1, color = 'purple' }: DracoIconProps) => {
  // Glow effect based on level
  const getGlow = () => {
    if (level < 5) return '';
    if (level < 10) return 'shadow-[0_0_15px_hsl(var(--primary)/0.4)]';
    if (level < 20) return 'shadow-[0_0_20px_hsl(var(--primary)/0.5)]';
    if (level < 50) return 'shadow-[0_0_25px_hsl(var(--primary)/0.6)]';
    return 'shadow-[0_0_30px_hsl(var(--primary)/0.7)]';
  };

  const imageSrc = DRACO_IMAGES[color] || DRACO_IMAGES.purple;

  return (
    <div className={cn('relative', className)}>
      <img
        src={imageSrc}
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
