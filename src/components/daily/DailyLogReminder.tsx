import { motion } from 'framer-motion';
import { Moon, Smartphone } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatLocalDate } from '@/utils/dateUtils';
import { useResponsive } from '@/hooks/useResponsive';

interface DailyLogReminderProps {
  onClick: () => void;
}

export const DailyLogReminder = ({ onClick }: DailyLogReminderProps) => {
  const { settings } = useAppStore();
  const { isMobile } = useResponsive();
  const todayStr = formatLocalDate(new Date());

  // Hide if today's log is already filled
  if (settings.lastDailyLogDate === todayStr) {
    return null;
  }

  if (isMobile) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        onClick={onClick}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 glass-card rounded-xl shadow-lg hover:border-primary/40 transition-colors flex items-center justify-center gap-1"
      >
        <Moon className="w-4 h-4 text-indigo-400" />
        <Smartphone className="w-3 h-3 text-indigo-300" />
      </motion.button>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      onClick={onClick}
      className="fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-3 glass-card rounded-xl shadow-lg hover:border-primary/40 transition-colors max-w-[280px]"
    >
      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
        <Moon className="w-4 h-4 text-indigo-400" />
      </div>
      <span className="text-sm text-foreground text-left">
        Quando quiser registrar seu sono e tempo de celular, estou aqui!
      </span>
    </motion.button>
  );
};

