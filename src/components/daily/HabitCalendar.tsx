import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

type CalendarView = 'week' | 'month';

export const HabitCalendar = () => {
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { habits, habitChecks } = useAppStore();

  const getCompletedHabits = (dateStr: string) => {
    return habits.filter(habit => {
      const check = habitChecks.find(hc => hc.habitId === habit.id && hc.date === dateStr);
      return check?.completed;
    });
  };

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

  const getPercentageColor = (percentage: number) => {
    if (percentage === 0) return 'bg-muted/30 text-muted-foreground';
    if (percentage <= 25) return 'bg-red-500/80 text-white';
    if (percentage <= 50) return 'bg-orange-500/80 text-white';
    if (percentage <= 75) return 'bg-yellow-500/80 text-black';
    return 'bg-green-500/80 text-white';
  };

  const getIndicatorColor = (percentage: number) => {
    if (percentage === 0) return 'bg-muted/30';
    if (percentage <= 25) return 'bg-red-500';
    if (percentage <= 50) return 'bg-orange-500';
    if (percentage <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const selectedDayHabits = selectedDate ? getCompletedHabits(selectedDate) : [];
  const selectedDayPercentage = selectedDate ? getCompletionPercentage(selectedDate) : 0;

  return (
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
          const isSelected = day.dateStr === selectedDate;
          const hasActivity = percentage > 0;

          return (
            <motion.button
              key={day.dateStr}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => setSelectedDate(isSelected ? null : day.dateStr)}
              className={cn(
                'aspect-square flex flex-col items-center justify-center rounded-xl transition-all relative',
                !day.isCurrentMonth && 'opacity-30',
                isToday && 'ring-2 ring-primary',
                isSelected && 'ring-2 ring-primary/50 bg-primary/10'
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

      {/* Completed Habits List */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-border/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-foreground">
                    {new Date(selectedDate).toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </h4>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-bold',
                    getPercentageColor(selectedDayPercentage)
                  )}>
                    {selectedDayPercentage}%
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {selectedDayHabits.length > 0 ? (
                <div className="space-y-2">
                  {selectedDayHabits.map((habit, i) => (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="w-5 h-5 rounded-md bg-green-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-500" />
                      </div>
                      <span className="text-foreground">{habit.emoji && `${habit.emoji} `}{habit.name}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum hábito concluído neste dia</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};