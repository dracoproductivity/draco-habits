import { motion } from 'framer-motion';
import { Calendar, Target, User, Settings, Flame } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { TabType } from '@/types';
import { cn } from '@/lib/utils';

const tabs: { id: TabType; label: string; icon: typeof Calendar }[] = [
  { id: 'daily', label: 'Daily', icon: Flame },
  { id: 'year', label: 'Ano', icon: Calendar },
  { id: 'goals', label: 'Objetivos', icon: Target },
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'settings', label: 'Config', icon: Settings },
];

export const BottomNav = () => {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex flex-col items-center justify-center w-16 h-full transition-all duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-2 top-0 h-0.5 gradient-fire rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className={cn('w-5 h-5', isActive && 'animate-scale-in')} />
              <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
