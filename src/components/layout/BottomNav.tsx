import { motion } from 'framer-motion';
import { Home, Target, Settings, CalendarDays, BarChart3 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { TabType } from '@/types';
import { cn } from '@/lib/utils';

const tabs: { id: TabType; label: string; icon: typeof CalendarDays }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'goals', label: 'Objetivos', icon: Target },
  { id: 'analytics', label: 'Análises', icon: BarChart3 },
  { id: 'data', label: 'Data', icon: CalendarDays },
  { id: 'settings', label: 'Config', icon: Settings },
];

export const BottomNav = () => {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 glass-card rounded-2xl border-border">
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
