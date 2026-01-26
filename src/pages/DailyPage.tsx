import { useState } from 'react';
import { motion } from 'framer-motion';
import { DailyHeader } from '@/components/daily/DailyHeader';
import { HabitList } from '@/components/daily/HabitList';
import { ProgressTimeline } from '@/components/daily/ProgressTimeline';
import { HabitCalendar } from '@/components/daily/HabitCalendar';
import { CategoryRadarChart } from '@/components/charts/CategoryRadarChart';
import { PeriodProgressIndicators } from '@/components/daily/PeriodProgressIndicators';
import { ProgressDisplayToggle } from '@/components/ui/ProgressDisplayToggle';
import { useResponsive } from '@/hooks/useResponsive';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { ProgressDisplayMode } from '@/types';

export const DailyPage = () => {
  const { isDesktop, isTablet } = useResponsive();
  const { settings, updateSettings } = useAppStore();
  
  // Per-page progress display mode
  const [localDisplayMode, setLocalDisplayMode] = useState<ProgressDisplayMode>(
    settings.pageProgressDisplayModes?.daily || settings.progressDisplayMode
  );
  
  const toggleDisplayMode = () => {
    const newMode = localDisplayMode === 'linear' ? 'circular' : 'linear';
    setLocalDisplayMode(newMode);
    updateSettings({
      pageProgressDisplayModes: {
        ...settings.pageProgressDisplayModes,
        daily: newMode,
        goals: settings.pageProgressDisplayModes?.goals || settings.progressDisplayMode,
        analytics: settings.pageProgressDisplayModes?.analytics || settings.progressDisplayMode,
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'min-h-screen',
        isDesktop ? 'pb-24 pt-6' : 'pb-20'
      )}
    >
      <DailyHeader />

      <div className={cn(
        'pt-2 pb-4',
        isDesktop ? 'px-0' : 'px-4'
      )}>
        {isDesktop ? (
          <>
            {/* Desktop: 3-column layout - Charts | Habits | Calendar */}
            <div className="grid grid-cols-3 gap-6" style={{ minHeight: '450px' }}>
              {/* Left column - Charts (Evolution + Progress) */}
              <div className="flex flex-col h-full">
                <ProgressTimeline className="h-full" />
              </div>
              
              {/* Middle column - Habits (centered title) */}
              <div className="flex flex-col h-full">
                <HabitList showProgressIndicators={false} centerTitle className="h-full" />
              </div>
              
              {/* Right column - Calendar */}
              <div className="flex flex-col h-full">
                <HabitCalendar className="h-full" />
              </div>
            </div>
            
            {/* Progress indicators below with toggle */}
            <div className="mt-6 relative">
              <div className="absolute right-0 top-0">
                <ProgressDisplayToggle mode={localDisplayMode} onToggle={toggleDisplayMode} />
              </div>
              <PeriodProgressIndicators displayMode={localDisplayMode} />
            </div>
            
            {/* Radar chart below progress indicators */}
            <div className="mt-6 flex justify-center">
              <div className="w-64">
                <h3 className="font-medium text-muted-foreground text-sm mb-2 text-center">Categorias</h3>
                <CategoryRadarChart className="h-[180px] w-full" compact />
              </div>
            </div>
          </>
        ) : (
          /* Mobile/Tablet: Vertical stack */
          <div className="space-y-6">
            <HabitList showProgressIndicators={false} centerTitle />
            
            {/* Progress indicators with toggle */}
            <div className="relative">
              <div className="absolute right-0 top-0">
                <ProgressDisplayToggle mode={localDisplayMode} onToggle={toggleDisplayMode} />
              </div>
              <PeriodProgressIndicators displayMode={localDisplayMode} />
            </div>
            
            {/* Radar chart */}
            <div className="flex justify-center">
              <div className="w-48">
                <h4 className="font-medium text-muted-foreground text-sm mb-2 text-center">Categorias</h4>
                <CategoryRadarChart compact className="h-[140px] w-full" />
              </div>
            </div>
            
            <ProgressTimeline />
            <HabitCalendar />
          </div>
        )}
      </div>
    </motion.div>
  );
};
