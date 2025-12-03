import { motion } from 'framer-motion';
import { DailyHeader } from '@/components/daily/DailyHeader';
import { HabitList } from '@/components/daily/HabitList';
import { ProgressBoxes } from '@/components/daily/ProgressBoxes';
import { ProgressTimeline } from '@/components/daily/ProgressTimeline';
import { HabitCalendar } from '@/components/daily/HabitCalendar';

export const DailyPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-20"
    >
      <DailyHeader />

      <div className="p-4 space-y-6">
        {/* Progress summary */}
        <ProgressBoxes />

        {/* Habit checklist */}
        <HabitList />

        {/* Progress timeline */}
        <ProgressTimeline />

        {/* Calendar view */}
        <HabitCalendar />
      </div>
    </motion.div>
  );
};
