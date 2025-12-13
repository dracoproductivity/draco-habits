import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Moon, Smartphone, Target, ListTodo, CalendarDays, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addWeeks, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { AnnualProgressView } from '@/components/analytics/AnnualProgressView';
import { CategoryRadarChart } from '@/components/charts/CategoryRadarChart';
import { UniversalHeader } from '@/components/layout/UniversalHeader';
import { cn } from '@/lib/utils';

type TimeRange = 'weekly' | 'monthly';
type ProgressFilter = 'habits' | 'goals';
type ProgressTimeRange = 'week' | 'month';
type AnalyticsView = 'progress' | 'charts';

export const AnalyticsPage = () => {
  const { settings, dailyLogs, habits, goals, habitChecks } = useAppStore();
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  const [analyticsView, setAnalyticsView] = useState<AnalyticsView>('progress');
  const [sleepTimeRange, setSleepTimeRange] = useState<TimeRange>('weekly');
  const [phoneTimeRange, setPhoneTimeRange] = useState<TimeRange>('weekly');
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('habits');
  const [progressTimeRange, setProgressTimeRange] = useState<ProgressTimeRange>('month');
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('all');

  const minSleepHours = settings.minSleepHours || 7;
  const maxPhoneHours = settings.maxPhoneHours || 2;

  // Find the earliest habit creation date as account start
  const accountStartDate = useMemo(() => {
    if (habits.length === 0) return new Date();
    const dates = habits.map(h => new Date(h.createdAt));
    return new Date(Math.min(...dates.map(d => d.getTime())));
  }, [habits]);

  const getDateRange = (range: TimeRange) => {
    const today = new Date();
    if (range === 'weekly') {
      return {
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
      };
    } else {
      return {
        start: startOfMonth(today),
        end: endOfMonth(today),
      };
    }
  };

  const getSleepData = useMemo(() => {
    const { start, end } = getDateRange(sleepTimeRange);
    const days = eachDayOfInterval({ start, end });

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const log = dailyLogs.find((l) => l.date === dateStr);
      return {
        date: format(day, 'dd/MM'),
        dayName: format(day, 'EEE', { locale: ptBR }),
        hours: log?.sleepHours ?? null,
        isBelowMin: log ? log.sleepHours < minSleepHours : false,
      };
    });
  }, [dailyLogs, sleepTimeRange, minSleepHours]);

  const getPhoneData = useMemo(() => {
    const { start, end } = getDateRange(phoneTimeRange);
    const days = eachDayOfInterval({ start, end });

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const log = dailyLogs.find((l) => l.date === dateStr);
      return {
        date: format(day, 'dd/MM'),
        dayName: format(day, 'EEE', { locale: ptBR }),
        hours: log?.phoneUsageHours ?? null,
        isAboveMax: log ? log.phoneUsageHours > maxPhoneHours : false,
      };
    });
  }, [dailyLogs, phoneTimeRange, maxPhoneHours]);

  // State for week/month navigation in progress chart
  const [progressReferenceDate, setProgressReferenceDate] = useState<Date>(new Date());

  const getProgressData = useMemo(() => {
    const baseDate = progressReferenceDate;
    let days;
    
    if (progressTimeRange === 'week') {
      days = eachDayOfInterval({
        start: startOfWeek(baseDate, { weekStartsOn: 1 }),
        end: endOfWeek(baseDate, { weekStartsOn: 1 }),
      });
    } else {
      days = eachDayOfInterval({
        start: startOfMonth(baseDate),
        end: endOfMonth(baseDate),
      });
    }

    if (progressFilter === 'habits') {
      const filteredHabits = selectedHabitId === 'all' 
        ? habits 
        : habits.filter((h) => h.id === selectedHabitId);

      return days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const isBeforeAccount = day < accountStartDate;
        const totalHabits = filteredHabits.length;
        
        if (isBeforeAccount || totalHabits === 0) {
          return { 
            date: format(day, 'dd/MM'), 
            progress: isBeforeAccount ? null : 0,
            isBeforeAccount 
          };
        }

        const completed = habitChecks.filter(
          (hc) => hc.date === dateStr && hc.completed && filteredHabits.some((h) => h.id === hc.habitId)
        ).length;

        return {
          date: format(day, 'dd/MM'),
          progress: Math.round((completed / totalHabits) * 100),
          isBeforeAccount: false,
        };
      });
    } else {
      // For goals, we show the goal's current progress
      const filteredGoals = selectedGoalId === 'all' 
        ? goals 
        : goals.filter((g) => g.id === selectedGoalId);

      if (filteredGoals.length === 0) {
        return days.map((day) => ({ 
          date: format(day, 'dd/MM'), 
          progress: day < accountStartDate ? null : 0,
          isBeforeAccount: day < accountStartDate 
        }));
      }

      const avgProgress = filteredGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / filteredGoals.length;

      return days.map((day) => {
        const isBeforeAccount = day < accountStartDate;
        return {
          date: format(day, 'dd/MM'),
          progress: isBeforeAccount ? null : Math.round(avgProgress),
          isBeforeAccount,
        };
      });
    }
  }, [progressFilter, progressTimeRange, selectedHabitId, selectedGoalId, habits, goals, habitChecks, accountStartDate, progressReferenceDate]);

  const SleepTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold text-foreground">
            {payload[0].value !== null ? `${payload[0].value}h` : 'Sem dados'}
          </p>
        </div>
      );
    }
    return null;
  };

  const ProgressTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold text-foreground">{payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen ${isDesktop ? 'pb-8' : 'pb-20'}`}
    >
      <UniversalHeader />

      <div className="p-4">
        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setAnalyticsView('progress')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all',
              analyticsView === 'progress'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
            )}
          >
            <CalendarDays className="w-4 h-4" />
            Progresso Anual
          </button>
          <button
            onClick={() => setAnalyticsView('charts')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all',
              analyticsView === 'charts'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Gráficos
          </button>
        </div>

        {analyticsView === 'progress' ? (
          <AnnualProgressView />
        ) : (
          <>
            {/* Sleep & Phone Charts - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Sleep Chart - Line chart with reference area */}
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <Moon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Horas de Sono</h3>
                      <p className="text-xs text-muted-foreground">Mínimo: {minSleepHours}h</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSleepTimeRange('weekly')}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        sleepTimeRange === 'weekly'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      Semana
                    </button>
                    <button
                      onClick={() => setSleepTimeRange('monthly')}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        sleepTimeRange === 'monthly'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      Mês
                    </button>
                  </div>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getSleepData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey={sleepTimeRange === 'weekly' ? 'dayName' : 'date'}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis
                        domain={[0, 12]}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickFormatter={(v) => `${v}h`}
                      />
                      <Tooltip content={<SleepTooltip />} />
                      {/* Reference area for below minimum - light red */}
                      <ReferenceArea
                        y1={0}
                        y2={minSleepHours}
                        fill="hsl(0 80% 50%)"
                        fillOpacity={0.08}
                        label={{ value: 'Quantidade mínima', position: 'insideBottomRight', fill: 'hsl(0 60% 50%)', fontSize: 9 }}
                      />
                      <ReferenceLine
                        y={minSleepHours}
                        stroke="hsl(0 70% 50%)"
                        strokeDasharray="5 5"
                        strokeOpacity={0.5}
                      />
                      <Line
                        type="monotone"
                        dataKey="hours"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={2}
                        connectNulls={false}
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          if (payload.hours === null) return null;
                          return (
                            <circle
                              key={`sleep-dot-${payload.date || payload.dayName}`}
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill={payload.isBelowMin ? 'hsl(0 80% 55%)' : 'hsl(210 90% 60%)'}
                              stroke={payload.isBelowMin ? 'hsl(0 80% 45%)' : 'hsl(210 90% 50%)'}
                              strokeWidth={2}
                            />
                          );
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Phone Usage Chart - Line chart with reference area */}
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Celular (inútil)</h3>
                      <p className="text-xs text-muted-foreground">Máximo: {maxPhoneHours}h</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPhoneTimeRange('weekly')}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        phoneTimeRange === 'weekly'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      Semana
                    </button>
                    <button
                      onClick={() => setPhoneTimeRange('monthly')}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        phoneTimeRange === 'monthly'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      Mês
                    </button>
                  </div>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getPhoneData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey={phoneTimeRange === 'weekly' ? 'dayName' : 'date'}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis
                        domain={[0, 12]}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickFormatter={(v) => `${v}h`}
                      />
                      <Tooltip content={<SleepTooltip />} />
                      {/* Reference area for above maximum - light red */}
                      <ReferenceArea
                        y1={maxPhoneHours}
                        y2={12}
                        fill="hsl(0 80% 50%)"
                        fillOpacity={0.08}
                        label={{ value: 'Quantidade máxima', position: 'insideTopRight', fill: 'hsl(0 60% 50%)', fontSize: 9 }}
                      />
                      <ReferenceLine
                        y={maxPhoneHours}
                        stroke="hsl(0 70% 50%)"
                        strokeDasharray="5 5"
                        strokeOpacity={0.5}
                      />
                      <Line
                        type="monotone"
                        dataKey="hours"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={2}
                        connectNulls={false}
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          if (payload.hours === null) return null;
                          return (
                            <circle
                              key={`phone-dot-${payload.date || payload.dayName}`}
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill={payload.isAboveMax ? 'hsl(0 80% 55%)' : 'hsl(25 95% 55%)'}
                              stroke={payload.isAboveMax ? 'hsl(0 80% 45%)' : 'hsl(25 95% 45%)'}
                              strokeWidth={2}
                            />
                          );
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Category Radar Chart - Floating without box */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Categorias</h3>
                  <p className="text-xs text-muted-foreground">Distribuição por categoria</p>
                </div>
              </div>
              <div className="h-64">
                <CategoryRadarChart className="h-full" />
              </div>
            </div>

            {/* Progress Chart with Filters */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                      <Target className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Progresso</h3>
                      <p className="text-xs text-muted-foreground">
                        {progressTimeRange === 'week'
                          ? `Semana de ${format(startOfWeek(progressReferenceDate, { weekStartsOn: 1 }), 'dd/MM')} a ${format(endOfWeek(progressReferenceDate, { weekStartsOn: 1 }), 'dd/MM')}`
                          : format(progressReferenceDate, 'MMMM yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setProgressTimeRange('week');
                        setProgressReferenceDate(new Date());
                      }}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        progressTimeRange === 'week'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      Semana
                    </button>
                    <button
                      onClick={() => {
                        setProgressTimeRange('month');
                        setProgressReferenceDate(new Date());
                      }}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        progressTimeRange === 'month'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      Mês
                    </button>
                  </div>
                </div>

                {/* Range navigation */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <button
                    onClick={() =>
                      setProgressReferenceDate((prev) =>
                        progressTimeRange === 'week' ? addWeeks(prev, -1) : addMonths(prev, -1)
                      )
                    }
                    className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted/40 transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    <span>Anterior</span>
                  </button>
                  <span className="font-medium">
                    {progressTimeRange === 'week'
                      ? `Semana ${format(startOfWeek(progressReferenceDate, { weekStartsOn: 1 }), 'dd/MM')}`
                      : format(progressReferenceDate, 'MMMM yyyy', { locale: ptBR })}
                  </span>
                  <button
                    onClick={() =>
                      setProgressReferenceDate((prev) =>
                        progressTimeRange === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1)
                      )
                    }
                    className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted/40 transition-colors"
                  >
                    <span>Próximo</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setProgressFilter('habits');
                        setSelectedHabitId('all');
                      }}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${
                        progressFilter === 'habits'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <ListTodo className="w-3 h-3" />
                      Hábitos
                    </button>
                    <button
                      onClick={() => {
                        setProgressFilter('goals');
                        setSelectedGoalId('all');
                      }}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${
                        progressFilter === 'goals'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Target className="w-3 h-3" />
                      Objetivos
                    </button>
                  </div>
                </div>

                {/* Sub-filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Filtrar:</span>
                  {progressFilter === 'habits' ? (
                    <select
                      value={selectedHabitId}
                      onChange={(e) => setSelectedHabitId(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    >
                      <option value="all">Todos os hábitos</option>
                      {habits.map((habit) => (
                        <option key={habit.id} value={habit.id}>
                          {habit.emoji ? `${habit.emoji} ` : ''}{habit.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={selectedGoalId}
                      onChange={(e) => setSelectedGoalId(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    >
                      <option value="all">Todos os objetivos</option>
                      {goals.map((goal) => (
                        <option key={goal.id} value={goal.id}>
                          {goal.emoji ? `${goal.emoji} ` : ''}{goal.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      interval={progressTimeRange === 'month' ? 6 : 0}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={<ProgressTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="progress"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (payload.isBeforeAccount) {
                          return (
                            <circle
                              key={`progress-dot-${payload.date}`}
                              cx={cx}
                              cy={cy || props.height / 2}
                              r={4}
                              fill="hsl(var(--muted))"
                              stroke="hsl(var(--muted))"
                            />
                          );
                        }
                        return (
                          <circle
                            key={`progress-dot-${payload.date}`}
                            cx={cx}
                            cy={cy}
                            r={3}
                            fill="hsl(var(--primary))"
                          />
                        );
                      }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
