import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

interface AppBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const AppBackground = ({ children, className }: AppBackgroundProps) => {
  const { settings } = useAppStore();
  
  const wallpaper = settings.darkMode ? settings.wallpaperDark : settings.wallpaperLight;
  const hasWallpaper = !!wallpaper;

  const getBackgroundStyle = () => {
    if (!wallpaper) return {};
    
    if (wallpaper.startsWith('linear-gradient')) {
      return { background: wallpaper };
    }
    
    if (wallpaper.startsWith('data:') || wallpaper.startsWith('http')) {
      return {
        backgroundImage: `url(${wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      };
    }
    
    return {};
  };

  return (
    <div 
      className={cn(
        'min-h-screen transition-all duration-500',
        !hasWallpaper && 'bg-background',
        className
      )}
      style={getBackgroundStyle()}
      data-has-wallpaper={hasWallpaper}
    >
      {children}
    </div>
  );
};
