import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { EvolutionChart } from './EvolutionChart';
import { ProgressCharts } from '@/components/charts/ProgressCharts';
import { useResponsive } from '@/hooks/useResponsive';

interface ProgressTimelineProps {
  className?: string;
}

export const ProgressTimeline = ({ className }: ProgressTimelineProps) => {
  const { isDesktop } = useResponsive();
  const [mobileView, setMobileView] = useState<'evolution' | 'progress'>('evolution');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("glass-hover rounded-2xl p-5 flex flex-col", className)}
    >
      {isDesktop ? (
        // Desktop: Stack Evolution and Progress charts
        <div className="flex flex-col gap-6 h-full">
          <EvolutionChart compact />
          <div className="border-t border-border/30 pt-4">
            <ProgressCharts compact hideEmoji />
          </div>
        </div>
      ) : (
        // Mobile/Tablet: Toggle between Evolution and Progress
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center gap-1 mb-4 bg-muted/30 rounded-xl p-1">
            <button
              onClick={() => setMobileView('evolution')}
              className={cn(
                'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                mobileView === 'evolution' 
                  ? 'gradient-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Evolução
            </button>
            <button
              onClick={() => setMobileView('progress')}
              className={cn(
                'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                mobileView === 'progress' 
                  ? 'gradient-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Progresso
            </button>
          </div>
          
          {mobileView === 'evolution' ? (
            <EvolutionChart />
          ) : (
            <ProgressCharts hideEmoji />
          )}
        </div>
      )}
    </motion.div>
  );
};
