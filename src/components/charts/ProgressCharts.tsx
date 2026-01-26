import { useState, useMemo } from 'react';
import { Target, ListTodo, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addWeeks,
  addMonths,
  addYears,
} from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { isHabitScheduledForDate, calculateHabitInstances } from '@/utils/habitInstanceCalculator';
import { formatPercentage } from '@/utils/formatPercentage';

type ProgressFilter = 'habits' | 'goals';
type ProgressTimeRange = 'week' | 'month' | 'year';

interface ProgressChartsProps {
  compact?: boolean;
  hideEmoji?: boolean;
}

export const ProgressCharts = ({ compact = false, hideEmoji = false }: ProgressChartsProps) => {
  const { habits, goals, habitChecks, settings } = useAppStore();

  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('habits');
  const [progressTimeRange, setProgressTimeRange] = useState<ProgressTimeRange>('month');
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('all');
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());

  const accountStartDate = useMemo(() => {
    if (habits.length === 0) return new Date();
    const dates = habits.map(h => new Date(h.createdAt));
    return new Date(Math.min(...dates.map(d => d.getTime())));
  }, [habits]);

  const getProgressData = useMemo(() => {
    const baseDate = referenceDate;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let days;
    
    if (progressTimeRange === 'week') {
      days = eachDayOfInterval({
        start: startOfWeek(baseDate, { weekStartsOn: 1 }),
        end: endOfWeek(baseDate, { weekStartsOn: 1 }),
      });
    } else if (progressTimeRange === 'month') {
      days = eachDayOfInterval({
        start: startOfMonth(baseDate),
        end: endOfMonth(baseDate),
      });
    } else {
      // Year view - sample monthly to avoid too many points
      const months = [];
      for (let i = 0; i < 12; i++) {
        months.push(new Date(baseDate.getFullYear(), i, 1));
      }
      days = months;
    }

    // Helper to check if a date is in the future
    const isFutureDate = (d: Date) => {
      if (progressTimeRange === 'year') {
        // For year view, check if month is in the future
        return d.getFullYear() > today.getFullYear() || 
          (d.getFullYear() === today.getFullYear() && d.getMonth() > today.getMonth());
      }
      return d > todayStart;
    };

    if (progressFilter === 'habits') {
      // For habits: Show total completion percentage at each day
      // Same formula as goals: X completed / N total for ENTIRE habit period
      const filteredHabits = selectedHabitId === 'all' 
        ? habits 
        : habits.filter((h) => h.id === selectedHabitId);

      if (filteredHabits.length === 0) {
        return days.map((day) => ({ 
          date: progressTimeRange === 'year' ? format(day, 'MMM') : format(day, 'dd/MM'), 
          progress: day < accountStartDate ? null : 0,
          isBeforeAccount: day < accountStartDate 
        }));
      }

      // Pre-calculate the TOTAL N for each habit (all scheduled instances for the entire period)
      const habitTotals = new Map<string, number>();
      
      filteredHabits.forEach(habit => {
        const linkedGoal = habit.goalId ? goals.find(g => g.id === habit.goalId) : null;
        const instances = calculateHabitInstances(habit, linkedGoal);
        habitTotals.set(habit.id, instances.length);
      });

      return days.map((day) => {
        const isBeforeAccount = day < accountStartDate;
        const isFuture = isFutureDate(day);
        
        if (isBeforeAccount || isFuture) {
          return { 
            date: progressTimeRange === 'year' ? format(day, 'MMM') : format(day, 'dd/MM'), 
            progress: null,
            isBeforeAccount,
            isFuture
          };
        }

        // For year view, calculate up to end of month
        const endDate = progressTimeRange === 'year' ? endOfMonth(day) : day;

        // For each day, calculate how many habits were completed UP TO this day
        // divided by the TOTAL habits for the entire period
        let totalHabitProgress = 0;
        let habitsWithInstances = 0;

        filteredHabits.forEach(habit => {
          const totalN = habitTotals.get(habit.id) || 0;
          if (totalN === 0) return;

          const linkedGoal = habit.goalId ? goals.find(g => g.id === habit.goalId) : null;
          const habitCreated = new Date(habit.createdAt);
          if (endDate < habitCreated) return;

          // Count how many instances were completed UP TO this day/month
          let completedX = 0;
          
          const daysToCheck = eachDayOfInterval({
            start: habitCreated,
            end: endDate,
          });

          daysToCheck.forEach(checkDay => {
            if (isHabitScheduledForDate(habit, checkDay, linkedGoal)) {
              const checkDateStr = format(checkDay, 'yyyy-MM-dd');
              const isCompleted = habitChecks.some(
                hc => hc.habitId === habit.id && hc.date === checkDateStr && hc.completed
              );
              if (isCompleted) {
                completedX++;
              }
            }
          });

          // Calculate % as completed / total for entire habit period
          const habitProgress = (completedX / totalN) * 100;
          totalHabitProgress += habitProgress;
          habitsWithInstances++;
        });

        // If viewing all habits, show the average % across all habits
        // If viewing single habit, show that habit's %
        const progress = habitsWithInstances > 0 ? totalHabitProgress / habitsWithInstances : 0;

        return {
          date: progressTimeRange === 'year' ? format(day, 'MMM') : format(day, 'dd/MM'),
          progress: Math.round(progress * 10) / 10,
          isBeforeAccount: false,
        };
      });
    } else {
      // For goals: Show the goal's TOTAL completion percentage at each day
      // This means: X completed / N total for the ENTIRE goal period
      // Example: Goal with 365 habits total -> day 10 shows 10/365 = 2.7%
      const filteredGoals = selectedGoalId === 'all' 
        ? goals 
        : goals.filter((g) => g.id === selectedGoalId);

      if (filteredGoals.length === 0) {
        return days.map((day) => ({ 
          date: progressTimeRange === 'year' ? format(day, 'MMM') : format(day, 'dd/MM'), 
          progress: day < accountStartDate ? null : 0,
          isBeforeAccount: day < accountStartDate 
        }));
      }

      // Pre-calculate the TOTAL N for each goal (all scheduled instances for the entire goal period)
      const goalTotals = new Map<string, number>();
      
      filteredGoals.forEach(goal => {
        const goalHabits = habits.filter(h => h.goalId === goal.id);
        let totalN = 0;
        
        goalHabits.forEach(habit => {
          const instances = calculateHabitInstances(habit, goal);
          totalN += instances.length;
        });
        
        goalTotals.set(goal.id, totalN);
      });

      return days.map((day) => {
        const isBeforeAccount = day < accountStartDate;
        const isFuture = isFutureDate(day);
        
        if (isBeforeAccount || isFuture) {
          return {
            date: progressTimeRange === 'year' ? format(day, 'MMM') : format(day, 'dd/MM'),
            progress: null,
            isBeforeAccount,
            isFuture,
          };
        }

        // For year view, calculate up to end of month
        const endDate = progressTimeRange === 'year' ? endOfMonth(day) : day;

        // For each day, calculate how many habits were completed UP TO this day/month
        // divided by the TOTAL habits for the entire goal
        let totalGoalProgress = 0;
        let goalsWithHabits = 0;

        filteredGoals.forEach(goal => {
          const goalHabits = habits.filter(h => h.goalId === goal.id);
          const totalN = goalTotals.get(goal.id) || 0;
          
          if (totalN === 0) return;

          // Count how many habits were completed UP TO this day/month
          let completedX = 0;

          goalHabits.forEach(habit => {
            const habitCreated = new Date(habit.createdAt);
            if (endDate < habitCreated) return;
            
            const daysToCheck = eachDayOfInterval({
              start: habitCreated,
              end: endDate,
            });

            daysToCheck.forEach(checkDay => {
              if (isHabitScheduledForDate(habit, checkDay, goal)) {
                const checkDateStr = format(checkDay, 'yyyy-MM-dd');
                const isCompleted = habitChecks.some(
                  hc => hc.habitId === habit.id && hc.date === checkDateStr && hc.completed
                );
                if (isCompleted) {
                  completedX++;
                }
              }
            });
          });

          // Calculate % as completed / total for entire goal
          const goalProgress = (completedX / totalN) * 100;
          totalGoalProgress += goalProgress;
          goalsWithHabits++;
        });

        // If viewing all goals, show the average % across all goals
        // If viewing single goal, show that goal's %
        const progress = goalsWithHabits > 0 ? totalGoalProgress / goalsWithHabits : 0;

        return {
          date: progressTimeRange === 'year' ? format(day, 'MMM') : format(day, 'dd/MM'),
          progress: Math.round(progress * 10) / 10,
          isBeforeAccount: false,
        };
      });
    }
  }, [progressFilter, progressTimeRange, selectedHabitId, selectedGoalId, habits, goals, habitChecks, accountStartDate, referenceDate]);

  const ProgressTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold text-foreground">
            {payload[0].value !== null ? formatPercentage(payload[0].value) : 'Sem dados'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!hideEmoji && (
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Target className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-foreground text-sm">Progresso</h3>
              <p className="text-xs text-muted-foreground">
                {progressTimeRange === 'week'
                  ? `Semana de ${format(startOfWeek(referenceDate, { weekStartsOn: 1 }), 'dd/MM')} a ${format(endOfWeek(referenceDate, { weekStartsOn: 1 }), 'dd/MM')}`
                  : progressTimeRange === 'year'
                  ? referenceDate.getFullYear().toString()
                  : format(referenceDate, 'MM/yyyy')}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => {
                setProgressTimeRange('week');
                setReferenceDate(new Date());
              }}
              className={`px-2 py-1 text-xs rounded-lg transition-colors ${
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
                setReferenceDate(new Date());
              }}
              className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                progressTimeRange === 'month'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => {
                setProgressTimeRange('year');
                setReferenceDate(new Date());
              }}
              className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                progressTimeRange === 'year'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              }`}
            >
              Ano
            </button>
          </div>
        </div>

        {/* Range navigation */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <button
            onClick={() =>
              setReferenceDate((prev) =>
                progressTimeRange === 'week' 
                  ? addWeeks(prev, -1) 
                  : progressTimeRange === 'year'
                  ? addYears(prev, -1)
                  : addMonths(prev, -1)
              )
            }
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted/40 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            <span>Anterior</span>
          </button>
          <span>
            {progressTimeRange === 'week'
              ? `Semana ${format(startOfWeek(referenceDate, { weekStartsOn: 1 }), 'dd/MM')}`
              : progressTimeRange === 'year'
              ? referenceDate.getFullYear().toString()
              : format(referenceDate, 'MMMM yyyy')}
          </span>
          <button
            onClick={() =>
              setReferenceDate((prev) =>
                progressTimeRange === 'week' 
                  ? addWeeks(prev, 1) 
                  : progressTimeRange === 'year'
                  ? addYears(prev, 1)
                  : addMonths(prev, 1)
              )
            }
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted/40 transition-colors"
          >
            <span>Próximo</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex gap-1">
            <button
              onClick={() => {
                setProgressFilter('habits');
                setSelectedHabitId('all');
              }}
              className={`px-2 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${
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
              className={`px-2 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${
                progressFilter === 'goals'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <Target className="w-3 h-3" />
              Objetivos
            </button>
          </div>
          
          {/* Filter dropdown - always visible */}
          <div className="flex-1 max-w-[180px]">
            {progressFilter === 'habits' ? (
              <select
                value={selectedHabitId}
                onChange={(e) => setSelectedHabitId(e.target.value)}
                className="w-full px-2 py-1 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="all">Todos</option>
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
                className="w-full px-2 py-1 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="all">Todos</option>
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.emoji ? `${goal.emoji} ` : ''}{goal.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className={compact ? "h-32" : "h-48 lg:h-[280px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={getProgressData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              interval={progressTimeRange === 'year' ? 0 : progressTimeRange === 'month' ? 6 : 0}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
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
                if (payload.isBeforeAccount || payload.progress === null) {
                  return null;
                }
                return (
                  <circle
                    key={`dot-${payload.date}`}
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
  );
};
