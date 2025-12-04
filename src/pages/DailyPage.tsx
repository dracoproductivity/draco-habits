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

      <div className="px-4 pt-2 pb-4 space-y-8">
        {/* Progress summary - clean, no boxes */}
        <ProgressBoxes />

        {/* Habit checklist - clean list style */}
        <HabitList />

        {/* Progress timeline - glass card */}
        <ProgressTimeline />

        {/* Calendar view - glass card with habit list */}
        <HabitCalendar />
      </div>
    </motion.div>
  );
};
