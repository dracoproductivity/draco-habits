import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

type CalendarView = 'week' | 'month';

export const HabitCalendar = () => {
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const { habits, habitChecks } = useAppStore();

  const getCompletedCount = (dateStr: string) => {
    return habitChecks.filter(
      (hc) => hc.date === dateStr && hc.completed
    ).length;
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Add days from previous month
    const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = startPadding; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        isCurrentMonth: false,
      });
    }

    // Add days of current month
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

  const getIndicatorColor = (count: number) => {
    if (count === 0) return 'bg-transparent';
    const percentage = (count / habits.length) * 100;
    if (percentage < 50) return 'bg-destructive/60';
    if (percentage < 80) return 'bg-primary/60';
    return 'bg-success';
  };

  return (
    <div className="card-dark p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Calendário</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('week')}
            className={cn(
              'px-3 py-1 rounded-lg text-sm transition-all',
              view === 'week' ? 'gradient-fire text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Semana
          </button>
          <button
            onClick={() => setView('month')}
            className={cn(
              'px-3 py-1 rounded-lg text-sm transition-all',
              view === 'month' ? 'gradient-fire text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Mês
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-medium">
          {currentDate.toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric',
          })}
        </span>
        <button
          onClick={() => navigate(1)}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground py-1">
            {day}
          </div>
        ))}

        {days.map((day, index) => {
          const count = getCompletedCount(day.dateStr);
          const isToday = day.dateStr === today;

          return (
            <motion.div
              key={day.dateStr}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              className={cn(
                'aspect-square flex flex-col items-center justify-center rounded-lg transition-all',
                !day.isCurrentMonth && 'opacity-30',
                isToday && 'ring-2 ring-primary'
              )}
            >
              <span className="text-xs mb-0.5">{day.date.getDate()}</span>
              {habits.length > 0 && (
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
                    <div
                      key={i}
                      className={cn('w-1.5 h-1.5 rounded-full', getIndicatorColor(count))}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
