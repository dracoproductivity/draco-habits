import { motion } from 'framer-motion';
import { DailyHeader } from '@/components/daily/DailyHeader';
import { HabitList } from '@/components/daily/HabitList';
import { ProgressTimeline } from '@/components/daily/ProgressTimeline';
import { HabitCalendar } from '@/components/daily/HabitCalendar';
import { CategoryRadarChart } from '@/components/charts/CategoryRadarChart';
import { PeriodProgressIndicators } from '@/components/daily/PeriodProgressIndicators';
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
            {/* Desktop: Habits centered, then progress indicators + radar below */}
            <div className="max-w-2xl mx-auto">
              <HabitList showProgressIndicators={false} />
            </div>
            
            {/* Progress indicators: day, week, month, quarter, year */}
            <div className="mt-6">
              <PeriodProgressIndicators />
            </div>
            
            {/* Radar chart below progress indicators */}
            <div className="mt-6 flex justify-center">
              <div className="w-64">
                <h3 className="font-medium text-muted-foreground text-sm mb-2 text-center">Categorias</h3>
                <CategoryRadarChart className="h-[180px] w-full" compact />
              </div>
            </div>
            
            {/* Timeline and Calendar */}
            <div className="mt-8 grid grid-cols-2 gap-8">
              <ProgressTimeline />
              <HabitCalendar />
            </div>
          </>
        ) : (
          /* Mobile/Tablet: Vertical stack */
          <div className="space-y-6">
            <HabitList showProgressIndicators={false} centerTitle />
            
            {/* Progress indicators: day, week, month, quarter, year */}
            <PeriodProgressIndicators />
            
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
