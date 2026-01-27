import { motion } from 'framer-motion';
import { Moon } from 'lucide-react';

interface DailyLogReminderProps {
  onClick: () => void;
}

export const DailyLogReminder = ({ onClick }: DailyLogReminderProps) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      onClick={onClick}
      className="fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-3 bg-muted/90 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg hover:bg-muted transition-colors max-w-[280px]"
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
