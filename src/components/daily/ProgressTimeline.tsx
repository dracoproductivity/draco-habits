import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

type ViewMode = 'week' | 'month';

export const ProgressTimeline = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [offset, setOffset] = useState(0);
  const { getDailyProgress } = useAppStore();

  const today = new Date();
  
  const getDays = () => {
    const days: { date: Date; dateStr: string; progress: number }[] = [];
    const count = viewMode === 'week' ? 7 : 30;
    
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i - (offset * count));
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: d,
        dateStr,
        progress: getDailyProgress(dateStr),
      });
    }
    
    return days;
  };

  const days = getDays();

  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-muted';
    if (progress < 50) return 'bg-destructive/60';
    if (progress < 80) return 'bg-primary/60';
    return 'bg-success';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3);
  };

  return (
    <div className="card-dark p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Linha do tempo</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('week')}
            className={cn(
              'px-3 py-1 rounded-lg text-sm transition-all',
              viewMode === 'week' ? 'gradient-fire text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Semana
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={cn(
              'px-3 py-1 rounded-lg text-sm transition-all',
              viewMode === 'month' ? 'gradient-fire text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Mês
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setOffset(offset + 1)}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 flex gap-1 overflow-hidden">
          {days.map((day, index) => (
            <motion.div
              key={day.dateStr}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <span className="text-[10px] text-muted-foreground">
                {viewMode === 'week' ? formatDate(day.date) : day.date.getDate()}
              </span>
              <div
                className={cn(
                  'w-full h-8 rounded transition-colors',
                  getProgressColor(day.progress)
                )}
                title={`${day.progress}%`}
              />
              <span className="text-[10px] text-muted-foreground">
                {day.progress}%
              </span>
            </motion.div>
          ))}
        </div>

        <button
          onClick={() => setOffset(Math.max(0, offset - 1))}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          disabled={offset === 0}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
