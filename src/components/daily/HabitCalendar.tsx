import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { CalendarDayModal } from './CalendarDayModal';

type CalendarView = 'week' | 'month';

export const HabitCalendar = () => {
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { habits, habitChecks } = useAppStore();

  const getCompletionPercentage = (dateStr: string) => {
    if (habits.length === 0) return 0;
    const completedCount = habitChecks.filter(
      (hc) => hc.date === dateStr && hc.completed
    ).length;
    return Math.round((completedCount / habits.length) * 100);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

    const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = startPadding; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        isCurrentMonth: true,
      });
    }

    return days;
  };

  const getWeekDays = () => {
    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        isCurrentMonth: true,
      });
    }

    return days;
  };

  const days = view === 'month' ? getDaysInMonth() : getWeekDays();
  const today = new Date().toISOString().split('T')[0];

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setDate(newDate.getDate() + direction * 7);
    }
    setCurrentDate(newDate);
  };

  const getIndicatorColor = (percentage: number) => {
    if (percentage === 0) return 'bg-muted/30';
    if (percentage <= 25) return 'bg-red-500';
    if (percentage <= 50) return 'bg-orange-500';
    if (percentage <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-hover rounded-2xl p-4 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Calendário</h3>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/30">
            <button
              onClick={() => setView('week')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                view === 'week' ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Semana
            </button>
            <button
              onClick={() => setView('month')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                view === 'month' ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mês
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium text-foreground capitalize">
            {currentDate.toLocaleDateString('pt-BR', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <button
            onClick={() => navigate(1)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Color legend */}
        <div className="flex items-center justify-center gap-2 text-xs">
          <span className="text-muted-foreground">Conclusão:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-muted-foreground">0-25%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500" />
            <span className="text-muted-foreground">26-50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-muted-foreground">51-75%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-muted-foreground">76-100%</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
            <div key={day} className="text-center text-xs text-muted-foreground py-2 font-medium">
              {day}
            </div>
          ))}

          {days.map((day, index) => {
            const percentage = getCompletionPercentage(day.dateStr);
            const isToday = day.dateStr === today;
            const hasActivity = percentage > 0;

            return (
              <motion.button
                key={day.dateStr}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                onClick={() => setSelectedDate(day.dateStr)}
                className={cn(
                  'aspect-square flex flex-col items-center justify-center rounded-xl transition-all relative cursor-pointer hover:bg-muted/30',
                  !day.isCurrentMonth && 'opacity-30',
                  isToday && 'ring-2 ring-primary'
                )}
              >
                <span className={cn(
                  'text-sm font-medium',
                  isToday && 'text-primary'
                )}>
                  {day.date.getDate()}
                </span>
                {habits.length > 0 && (
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full mt-0.5',
                    getIndicatorColor(percentage)
                  )} />
                )}
                {hasActivity && (
                  <span className={cn(
                    'absolute -bottom-0.5 text-[8px] font-bold px-1 rounded',
                    percentage <= 25 ? 'text-red-500' :
                    percentage <= 50 ? 'text-orange-500' :
                    percentage <= 75 ? 'text-yellow-600' :
                    'text-green-500'
                  )}>
                    {percentage}%
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Calendar Day Modal */}
      <AnimatePresence>
        {selectedDate && (
          <CalendarDayModal 
            date={selectedDate} 
            onClose={() => setSelectedDate(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};