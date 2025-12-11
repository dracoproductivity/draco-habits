import { motion } from 'framer-motion';
import { DailyHeader } from '@/components/daily/DailyHeader';
import { HabitList } from '@/components/daily/HabitList';
import { ProgressTimeline } from '@/components/daily/ProgressTimeline';
import { HabitCalendar } from '@/components/daily/HabitCalendar';
import { CategoryRadarChart } from '@/components/charts/CategoryRadarChart';
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
            {/* Desktop: Habits on left, Timeline + Radar on right */}
            <div className="grid grid-cols-2 gap-8">
              {/* Left column: Habit checklist with progress */}
              <HabitList />
              
              {/* Right column: Progress timeline + floating radar */}
              <div className="flex gap-6 items-stretch">
                <div className="flex-1">
                  <ProgressTimeline />
                </div>
                {/* Floating Radar Chart - centered vertically */}
                <div className="flex flex-col justify-center items-center w-48">
                  <h3 className="font-medium text-muted-foreground text-sm mb-2 text-center">Categorias</h3>
                  <CategoryRadarChart className="h-[180px] w-full" compact />
                </div>
              </div>
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
            <div className="flex gap-4 items-stretch">
              <div className="flex-1">
                <ProgressTimeline />
              </div>
              {/* Floating Radar Chart on mobile - centered vertically */}
              <div className="w-40 flex flex-col justify-center items-center">
                <h4 className="font-medium text-muted-foreground text-sm mb-2 text-center">Categorias</h4>
                <CategoryRadarChart compact className="h-[140px] w-full" />
              </div>
            </div>
            <HabitCalendar />
          </div>
        )}
      </div>
    </motion.div>
  );
};
