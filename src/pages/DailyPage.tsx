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
        isDesktop ? 'px-0' : 'px-4'
      )}>
        {isDesktop ? (
          <>
            {/* Desktop: Habits on left, Timeline on right */}
            <div className="grid grid-cols-2 gap-8">
              {/* Left column: Habit checklist with progress */}
              <HabitList />
              
              {/* Right column: Progress timeline */}
              <ProgressTimeline />
            </div>
            
            {/* Calendar below, full width */}
            <div className="mt-8">
              <HabitCalendar />
            </div>
          </>
        ) : (
          /* Mobile/Tablet: Vertical stack */
          <div className="space-y-8">
            <HabitList />
            <ProgressTimeline />
            <HabitCalendar />
          </div>
        )}
      </div>
    </motion.div>
  );
};
