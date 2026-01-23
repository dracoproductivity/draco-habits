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
        // Mobile/Tablet: Just show Evolution chart
        <EvolutionChart />
      )}
    </motion.div>
  );
};
