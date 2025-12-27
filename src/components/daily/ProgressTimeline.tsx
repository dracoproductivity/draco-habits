import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, BarChart3, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ProgressCharts } from '@/components/charts/ProgressCharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { isHabitScheduledForDate } from '@/utils/habitInstanceCalculator';

type ViewMode = 'week' | 'month';
type ChartMode = 'evolution' | 'progress';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const ProgressTimeline = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [chartMode, setChartMode] = useState<ChartMode>('evolution');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [weekOffset, setWeekOffset] = useState(0);
  const { habits, goals, habitChecks } = useAppStore();

  const today = new Date();
  
  const getWeekMonday = () => {
    const currentDay = today.getDay();
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday - (weekOffset * 7));
    return monday;
  };

  const getWeekDateRange = () => {
    const monday = getWeekMonday();
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
    return `${formatDate(monday)} - ${formatDate(sunday)}`;
  };

  const isCurrentWeek = weekOffset === 0;
  const isCurrentMonth = selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
  
  // Calculate daily progress for a specific date
  const calculateDailyProgress = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Get habits that are scheduled for this date
    const scheduledHabits = habits.filter(habit => {
      const linkedGoal = habit.goalId ? goals.find(g => g.id === habit.goalId) : null;
      return isHabitScheduledForDate(habit, date, linkedGoal);
    });
    
    if (scheduledHabits.length === 0) return 0;
    
    // Count completed habits
    const completedCount = habitChecks.filter(
      hc => hc.date === dateStr && hc.completed && scheduledHabits.some(h => h.id === hc.habitId)
    ).length;
    
    return Math.round((completedCount / scheduledHabits.length) * 100);
  };
  
  const getWeekDays = useMemo(() => {
    const days: { name: string; progress: number }[] = [];
    const monday = getWeekMonday();
    
    const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        name: dayNames[i],
        progress: calculateDailyProgress(d),
      });
    }
    
    return days;
  }, [weekOffset, habits, goals, habitChecks]);

  const getMonthDays = useMemo(() => {
    const days: { name: string; progress: number }[] = [];
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(selectedYear, selectedMonth, i);
      days.push({
        name: i.toString(),
        progress: calculateDailyProgress(d),
      });
    }
    
    return days;
  }, [selectedMonth, selectedYear, habits, goals, habitChecks]);

  const chartData = viewMode === 'week' 
    ? getWeekDays 
    : getMonthDays;

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleReturnToNow = () => {
    if (viewMode === 'week') {
      setWeekOffset(0);
    } else {
      setSelectedMonth(today.getMonth());
      setSelectedYear(today.getFullYear());
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-medium text-foreground">{payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-hover rounded-2xl p-5"
    >
      {/* Chart Mode Toggle */}
      <div className="flex items-center gap-1 mb-4 bg-muted/30 rounded-xl p-1">
        <button
          onClick={() => setChartMode('evolution')}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all',
            chartMode === 'evolution' 
              ? 'gradient-primary text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Evolução
        </button>
        <button
          onClick={() => setChartMode('progress')}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1',
            chartMode === 'progress' 
              ? 'gradient-primary text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <BarChart3 className="w-3 h-3" />
          Progresso
        </button>
      </div>

      {chartMode === 'evolution' && (
        <>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-foreground">Evolução</h3>
              <p className="text-xs text-muted-foreground">
                {viewMode === 'week' 
                  ? getWeekDateRange()
                  : `${MONTHS[selectedMonth]} ${selectedYear}`
                }
              </p>
            </div>
            <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
              <button
                onClick={() => setViewMode('week')}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                  viewMode === 'week' 
                    ? 'gradient-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Semana
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                  viewMode === 'month' 
                    ? 'gradient-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Mês
              </button>
            </div>
          </div>

          {viewMode === 'week' ? (
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-muted-foreground">
                {weekOffset === 0 ? 'Esta semana' : weekOffset > 0 ? `${weekOffset} semana(s) atrás` : `${Math.abs(weekOffset)} semana(s) à frente`}
              </span>
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {!isCurrentWeek && (
                <button
                  onClick={handleReturnToNow}
                  className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-all"
                  title="Voltar para esta semana"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-foreground min-w-[140px] text-center">
                {MONTHS[selectedMonth]} {selectedYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {!isCurrentMonth && (
                <button
                  onClick={handleReturnToNow}
                  className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-all"
                  title="Voltar para este mês"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  interval={viewMode === 'month' ? 4 : 0}
                />
                <YAxis 
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="progress" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#progressGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {chartMode === 'progress' && (
        <ProgressCharts />
      )}

    </motion.div>
  );
};
