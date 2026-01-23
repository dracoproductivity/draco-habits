import { motion } from 'framer-motion';
import { Target, Settings, CalendarDays, BarChart3 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { TabType } from '@/types';
import { cn } from '@/lib/utils';

const tabs: { id: TabType; label: string; icon: typeof CalendarDays }[] = [
  { id: 'daily', label: 'Daily', icon: CalendarDays },
  { id: 'goals', label: 'Objetivos', icon: Target },
  { id: 'analytics', label: 'Análises', icon: BarChart3 },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export const DesktopBottomNav = () => {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <nav className="hidden lg:flex fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="mx-auto flex items-center gap-2 px-6 py-3 rounded-2xl glass border border-border/30">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200',
                isActive 
                  ? 'gradient-fire text-primary-foreground shadow-lg' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTabDesktopBottom"
                  className="absolute inset-0 gradient-fire rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
