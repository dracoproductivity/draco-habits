import { motion } from 'framer-motion';
import { DailyHeader } from '@/components/daily/DailyHeader';
import { HabitList } from '@/components/daily/HabitList';
import { ProgressTimeline } from '@/components/daily/ProgressTimeline';
import { HabitCalendar } from '@/components/daily/HabitCalendar';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

export const DailyPage = () => {
  const { isDesktop, isTablet } = useResponsive();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'min-h-screen',
        isDesktop ? 'pb-8 pt-6' : 'pb-20'
      )}
    >
      <DailyHeader />

      <div className={cn(
        'pt-2 pb-4',
        isDesktop ? 'px-0' : 'px-4',
        isDesktop ? 'grid grid-cols-2 gap-8' : 'space-y-8'
      )}>
        {/* Left column on desktop */}
        <div className="space-y-8">
          {/* Habit checklist with progress on the side */}
          <HabitList />

          {/* Progress timeline - glass card */}
          <ProgressTimeline />
        </div>

        {/* Right column on desktop, below on mobile */}
        <div className={cn(isDesktop && 'space-y-8')}>
          {/* Calendar view - glass card with habit list */}
          <HabitCalendar />
        </div>
      </div>
    </motion.div>
  );
};
