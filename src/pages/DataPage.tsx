import { useState } from 'react';
import { motion } from 'framer-motion';
import { UniversalHeader } from '@/components/layout/UniversalHeader';
import { AnnualProgressView } from '@/components/analytics/AnnualProgressView';
import { HabitCalendar } from '@/components/daily/HabitCalendar';
import { ProgressDisplayToggle } from '@/components/ui/ProgressDisplayToggle';
import { useAppStore } from '@/store/useAppStore';
import { useResponsive } from '@/hooks/useResponsive';
import { ProgressDisplayMode } from '@/types';

export const DataPage = () => {
  const { settings, updateSettings } = useAppStore();
  const { isDesktop } = useResponsive();
  
  // Per-page progress display mode
  const [localDisplayMode, setLocalDisplayMode] = useState<ProgressDisplayMode>(
    settings.pageProgressDisplayModes?.analytics || settings.progressDisplayMode
  );
  
  const toggleDisplayMode = () => {
    const newMode = localDisplayMode === 'linear' ? 'circular' : 'linear';
    setLocalDisplayMode(newMode);
    updateSettings({
      pageProgressDisplayModes: {
        ...settings.pageProgressDisplayModes,
        home: settings.pageProgressDisplayModes?.home || settings.progressDisplayMode,
        goals: settings.pageProgressDisplayModes?.goals || settings.progressDisplayMode,
        analytics: newMode,
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen ${isDesktop ? 'pb-8' : 'pb-20'}`}
    >
      <UniversalHeader />

      <div className="p-4">
        {/* Progress Display Toggle */}
        <div className="flex justify-end mb-4">
          <ProgressDisplayToggle mode={localDisplayMode} onToggle={toggleDisplayMode} />
        </div>

        {/* Annual Progress View */}
        <AnnualProgressView displayMode={localDisplayMode} />

        {/* Calendar */}
        <div className="glass-card rounded-2xl p-4 mt-6">
          <h3 className="font-semibold text-foreground mb-4 text-center">Calendário de Hábitos</h3>
          <HabitCalendar />
        </div>
      </div>
    </motion.div>
  );
};
