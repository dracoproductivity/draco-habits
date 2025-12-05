import { motion } from 'framer-motion';
import { Target, Settings, Flame, BarChart3 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { TabType } from '@/types';
import { cn } from '@/lib/utils';
import { DracoIcon } from '@/components/icons/DracoIcon';
import dracoLogo from '@/assets/draco-logo.jpeg';

const tabs: { id: TabType; label: string; icon: typeof Flame }[] = [
  { id: 'daily', label: 'Daily', icon: Flame },
  { id: 'goals', label: 'Objetivos', icon: Target },
  { id: 'analytics', label: 'Análises', icon: BarChart3 },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export const DesktopSidebar = () => {
  const { activeTab, setActiveTab, draco, user } = useAppStore();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-card/50 backdrop-blur-xl border-r border-border/50 z-40">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden">
            <img src={dracoLogo} alt="Draco Habits" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gradient-primary">Draco Habits</h1>
            <p className="text-xs text-muted-foreground">Gamifique seus hábitos</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
          <div className="w-10 h-10 animate-float">
            <DracoIcon level={draco.level} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">
              {user?.firstName || 'Usuário'} 
            </p>
            <p className="text-xs text-muted-foreground">
              Nível {draco.level} • {draco.totalXP} XP
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive 
                  ? 'gradient-fire text-primary-foreground shadow-lg' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTabDesktop"
                  className="absolute inset-0 gradient-fire rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/30">
        <p className="text-xs text-center text-muted-foreground">
          © 2024 Draco Habits
        </p>
      </div>
    </aside>
  );
};
