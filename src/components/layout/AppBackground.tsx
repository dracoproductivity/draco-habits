import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const AppBackground = ({ children, className }: AppBackgroundProps) => {
  const { settings } = useAppStore();
  const isMobile = useIsMobile();
  
  // Choose wallpaper based on device type and theme
  const getWallpaper = () => {
    if (isMobile) {
      // Mobile: use mobile wallpapers if available, fallback to desktop
      return settings.darkMode 
        ? (settings.wallpaperMobileDark || settings.wallpaperDark)
        : (settings.wallpaperMobileLight || settings.wallpaperLight);
    }
    // Desktop: use desktop wallpapers
    return settings.darkMode ? settings.wallpaperDark : settings.wallpaperLight;
  };
  
  const wallpaper = getWallpaper();
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
