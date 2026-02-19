import { motion } from 'framer-motion';
import { Home, Target, Settings, CalendarDays, BarChart3, StickyNote } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { TabType } from '@/types';
import { cn } from '@/lib/utils';

const tabs: { id: TabType; label: string; icon: typeof CalendarDays }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'goals', label: 'Objetivos', icon: Target },
  { id: 'notes', label: 'Notas', icon: StickyNote },
  { id: 'analytics', label: 'Análises', icon: BarChart3 },
  { id: 'history', label: 'Histórico', icon: CalendarDays },
  { id: 'settings', label: 'Config', icon: Settings },
];

export const DesktopSidebar = ({ side = 'left' }: { side?: 'left' | 'right' }) => {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <nav
      className={cn(
        "hidden lg:flex fixed top-1/2 -translate-y-1/2 z-50 glass-card rounded-2xl",
        side === 'left' ? "left-4" : "right-4"
      )}
    >
      <div className="flex flex-col items-center justify-around py-3 px-1 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex flex-col items-center justify-center w-14 h-14 transition-all duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabSidebar"
                  className={cn(
                    "absolute inset-y-2 w-0.5 gradient-fire rounded-full",
                    side === 'left' ? "right-0" : "left-0"
                  )}
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
