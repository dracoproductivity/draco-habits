import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

export const ProgressBoxes = () => {
  const { getDailyProgress, getWeeklyProgress } = useAppStore();
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const getWeekStart = () => {
    const d = new Date(today);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

  const dailyProgress = getDailyProgress(todayStr);
  const weeklyProgress = getWeeklyProgress(getWeekStart());

  return (
    <div className="flex items-center justify-center gap-12">
      <ProgressItem 
        label="Hoje" 
        progress={dailyProgress} 
        delay={0}
      />
      <div className="w-px h-16 bg-border/30" />
      <ProgressItem 
        label="Semana" 
        progress={weeklyProgress} 
        delay={0.1}
      />
    </div>
  );
};

interface ProgressItemProps {
  label: string;
  progress: number;
  delay?: number;
}

const ProgressItem = ({ label, progress, delay = 0 }: ProgressItemProps) => {
  const circumference = 2 * Math.PI * 32;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex flex-col items-center"
    >
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="hsl(var(--muted) / 0.3)"
            strokeWidth="4"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut', delay: delay + 0.2 }}
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground text-shadow-glow">{progress}%</span>
        </div>
      </div>
      <span className="text-sm text-muted-foreground mt-2 font-medium">{label}</span>
    </motion.div>
  );
};
