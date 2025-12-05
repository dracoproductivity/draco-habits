import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Moon, Smartphone, Target, ListTodo } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

type TimeRange = 'weekly' | 'monthly';
type ProgressFilter = 'habits' | 'goals';

export const AnalyticsPage = () => {
  const { settings, dailyLogs, habits, goals, habitChecks } = useAppStore();
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  const [sleepTimeRange, setSleepTimeRange] = useState<TimeRange>('weekly');
  const [phoneTimeRange, setPhoneTimeRange] = useState<TimeRange>('weekly');
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('habits');
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('all');

  const minSleepHours = settings.minSleepHours || 7;
  const maxPhoneHours = settings.maxPhoneHours || 2;

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

  const getProgressData = useMemo(() => {
    const today = new Date();
    const days = eachDayOfInterval({
      start: subDays(today, 30),
      end: today,
    });

    if (progressFilter === 'habits') {
      const filteredHabits = selectedHabitId === 'all' 
        ? habits 
        : habits.filter((h) => h.id === selectedHabitId);

      return days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const totalHabits = filteredHabits.length;
        if (totalHabits === 0) return { date: format(day, 'dd/MM'), progress: 0 };

        const completed = habitChecks.filter(
          (hc) => hc.date === dateStr && hc.completed && filteredHabits.some((h) => h.id === hc.habitId)
        ).length;

        return {
          date: format(day, 'dd/MM'),
          progress: Math.round((completed / totalHabits) * 100),
        };
      });
    } else {
      // For goals, we show the goal's current progress
      const filteredGoals = selectedGoalId === 'all' 
        ? goals 
        : goals.filter((g) => g.id === selectedGoalId);

      if (filteredGoals.length === 0) {
        return days.map((day) => ({ date: format(day, 'dd/MM'), progress: 0 }));
      }

      const avgProgress = filteredGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / filteredGoals.length;

      return days.map((day) => ({
        date: format(day, 'dd/MM'),
        progress: Math.round(avgProgress),
      }));
    }
  }, [progressFilter, selectedHabitId, selectedGoalId, habits, goals, habitChecks]);

  const CustomTooltip = ({ active, payload, label }: any) => {
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
      className={`min-h-screen p-4 ${isDesktop ? 'pb-8 pt-6' : 'pb-20'}`}
    >
      <header className="mb-6">
        <h1 className={`font-bold text-gradient-primary ${isDesktop ? 'text-3xl' : 'text-2xl'}`}>Análises</h1>
        <p className="text-muted-foreground">Acompanhe seus dados de saúde</p>
      </header>

      {/* Sleep & Phone Charts */}
      <div className={`${isDesktop ? 'grid grid-cols-2 gap-4' : 'space-y-4'} mb-6`}>
        {/* Sleep Chart */}
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

          <div className="h-48">
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
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={minSleepHours}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="5 5"
                  strokeOpacity={0.7}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="hsl(210 90% 60%)"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.hours === null) return null;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={payload.isBelowMin ? 'hsl(0 80% 55%)' : 'hsl(210 90% 60%)'}
                        stroke="none"
                      />
                    );
                  }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Phone Usage Chart */}
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

          <div className="h-48">
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
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={maxPhoneHours}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="5 5"
                  strokeOpacity={0.7}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="hsl(25 95% 55%)"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.hours === null) return null;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={payload.isAboveMax ? 'hsl(0 80% 55%)' : 'hsl(25 95% 55%)'}
                        stroke="none"
                      />
                    );
                  }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
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
                <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
              </div>
            </div>
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
                className="flex-1 px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                className="flex-1 px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                interval={sleepTimeRange === 'monthly' ? 6 : 0}
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
                dot={{ fill: 'hsl(var(--primary))', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};
