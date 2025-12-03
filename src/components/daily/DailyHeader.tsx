import { User } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { DracoIcon } from '@/components/icons/DracoIcon';
import { XPBar } from '@/components/ui/XPBar';

export const DailyHeader = () => {
  const { user, draco } = useAppStore();

  return (
    <header className="flex items-center justify-between p-4 border-b border-border">
      {/* Left side - User info */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/30">
          {user?.photo ? (
            <img src={user.photo} alt={user.firstName} className="w-full h-full object-cover" />
          ) : (
            <User className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Olá,</p>
          <h2 className="font-semibold text-lg leading-tight">
            {user?.firstName || 'Usuário'}
          </h2>
        </div>
      </div>

      {/* Right side - Draco & XP */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
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
          <DracoIcon level={draco.level} />
        </div>
      </div>
    </header>
  );
};
