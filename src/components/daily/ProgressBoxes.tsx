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
    <div className="grid grid-cols-2 gap-3">
      <ProgressCard 
        label="Hoje" 
        progress={dailyProgress} 
        delay={0}
      />
      <ProgressCard 
        label="Semana" 
        progress={weeklyProgress} 
        delay={0.1}
      />
    </div>
  );
};

interface ProgressCardProps {
  label: string;
  progress: number;
  delay?: number;
}

const ProgressCard = ({ label, progress, delay = 0 }: ProgressCardProps) => {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 flex flex-col items-center"
    >
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="6"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-foreground">{progress}%</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-2">{label}</span>
    </motion.div>
  );
};
