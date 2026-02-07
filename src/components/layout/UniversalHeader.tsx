import { User } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { DracoIcon } from '@/components/icons/DracoIcon';
import { XPBar } from '@/components/ui/XPBar';
import { useResponsive } from '@/hooks/useResponsive';
import dracoLogo from '@/assets/draco-logo-new.png';

export const UniversalHeader = () => {
  const { user, draco } = useAppStore();
  const { isDesktop } = useResponsive();

  return (
    <header className="flex items-center justify-between px-4 py-3">
      {/* Left side - Logo + App name + User photo */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
          <img src={dracoLogo} alt="Draco Habits" className="w-full h-full object-cover" />
        </div>
        {isDesktop && (
          <span className="font-bold text-lg text-foreground mr-2">Draco Habits</span>
        )}
        
        {/* User photo */}
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/30">
          {user?.photo ? (
            <img src={user.photo} alt={user.firstName} className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Right side - Draco & XP */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-sm text-primary font-semibold">{draco.name}</span>
          <span className="text-xs text-muted-foreground">Nível {draco.level}</span>
          <XPBar
            currentXP={draco.currentXP}
            xpToNextLevel={draco.xpToNextLevel}
            level={draco.level}
            showLabel={false}
            className="w-24"
          />
        </div>
        <div className="w-12 h-12 animate-float">
          <DracoIcon level={draco.level} color={draco.color} />
        </div>
      </div>
    </header>
  );
};
