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
  addWeeks,
  addMonths,
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
import { isHabitScheduledForDate } from '@/utils/habitInstanceCalculator';
import { formatPercentage } from '@/utils/formatPercentage';

type ProgressFilter = 'habits' | 'goals';
type ProgressTimeRange = 'week' | 'month';

interface ProgressChartsProps {
  compact?: boolean;
}

export const ProgressCharts = ({ compact = false }: ProgressChartsProps) => {
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
      // For habits: X/N progression over time
      // X = habits checked, N = habits scheduled
      const filteredHabits = selectedHabitId === 'all' 
        ? habits 
        : habits.filter((h) => h.id === selectedHabitId);

      return days.map((day) => {
        const isBeforeAccount = day < accountStartDate;
        
        if (isBeforeAccount) {
          return { 
            date: format(day, 'dd/MM'), 
            progress: null,
            isBeforeAccount: true 
          };
        }

        // Calculate cumulative X/N from habit creation up to this day
        let totalX = 0;
        let totalN = 0;

        filteredHabits.forEach(habit => {
          const habitCreated = new Date(habit.createdAt);
          if (day < habitCreated) return;
          
          const linkedGoal = habit.goalId ? goals.find(g => g.id === habit.goalId) : null;
          
          // Count all scheduled instances from habit creation to this day
          const daysToCheck = eachDayOfInterval({
            start: habitCreated,
            end: day,
          });

          daysToCheck.forEach(checkDay => {
            if (isHabitScheduledForDate(habit, checkDay, linkedGoal)) {
              totalN++;
              const checkDateStr = format(checkDay, 'yyyy-MM-dd');
              const isCompleted = habitChecks.some(
                hc => hc.habitId === habit.id && hc.date === checkDateStr && hc.completed
              );
              if (isCompleted) {
                totalX++;
              }
            }
          });
        });

        const progress = totalN > 0 ? (totalX / totalN) * 100 : 0;

        return {
          date: format(day, 'dd/MM'),
          progress: Math.round(progress * 10) / 10,
          isBeforeAccount: false,
        };
      });
    } else {
      // For goals: Show the goal's completion percentage snapshot at each day
      // This shows how the goal's % completion evolved over time
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

      return days.map((day) => {
        const isBeforeAccount = day < accountStartDate;
        
        if (isBeforeAccount) {
          return {
            date: format(day, 'dd/MM'),
            progress: null,
            isBeforeAccount: true,
          };
        }

        // For each day, calculate the goal's completion % as a snapshot up to that day
        // This means: how much of the goal was completed BY this day
        let totalGoalProgress = 0;
        let goalsWithHabits = 0;

        filteredGoals.forEach(goal => {
          const goalHabits = habits.filter(h => h.goalId === goal.id);
          
          // Only count goals that have habits and those habits existed by this day
          const activeHabits = goalHabits.filter(h => {
            const habitCreated = new Date(h.createdAt);
            return habitCreated <= day;
          });

          if (activeHabits.length === 0) return;

          // Calculate cumulative X/N for this goal up to this day
          let goalX = 0;
          let goalN = 0;

          activeHabits.forEach(habit => {
            const habitCreated = new Date(habit.createdAt);
            
            const daysToCheck = eachDayOfInterval({
              start: habitCreated,
              end: day,
            });

            daysToCheck.forEach(checkDay => {
              if (isHabitScheduledForDate(habit, checkDay, goal)) {
                goalN++;
                const checkDateStr = format(checkDay, 'yyyy-MM-dd');
                const isCompleted = habitChecks.some(
                  hc => hc.habitId === habit.id && hc.date === checkDateStr && hc.completed
                );
                if (isCompleted) {
                  goalX++;
                }
              }
            });
          });

          if (goalN > 0) {
            totalGoalProgress += (goalX / goalN) * 100;
            goalsWithHabits++;
          }
        });

        // If viewing all goals, show the average % across all goals
        // If viewing single goal, show that goal's %
        const progress = goalsWithHabits > 0 ? totalGoalProgress / goalsWithHabits : 0;

        return {
          date: format(day, 'dd/MM'),
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
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Target className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Progresso</h3>
              <p className="text-xs text-muted-foreground">
                {progressTimeRange === 'week'
                  ? `Semana de ${format(startOfWeek(referenceDate, { weekStartsOn: 1 }), 'dd/MM')} a ${format(endOfWeek(referenceDate, { weekStartsOn: 1 }), 'dd/MM')}`
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
          </div>
        </div>

        {/* Range navigation */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <button
            onClick={() =>
              setReferenceDate((prev) =>
                progressTimeRange === 'week' ? addWeeks(prev, -1) : addMonths(prev, -1)
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
              : format(referenceDate, 'MMMM yyyy')}
          </span>
          <button
            onClick={() =>
              setReferenceDate((prev) =>
                progressTimeRange === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1)
              )
            }
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted/40 transition-colors"
          >
            <span>Próximo</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-1">
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
        </div>

        {!compact && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filtrar:</span>
            {progressFilter === 'habits' ? (
              <select
                value={selectedHabitId}
                onChange={(e) => setSelectedHabitId(e.target.value)}
                className="flex-1 px-2 py-1.5 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
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
                className="flex-1 px-2 py-1.5 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
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
        )}
      </div>

      <div className={compact ? "h-32" : "h-48"}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={getProgressData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              interval={progressTimeRange === 'month' ? 6 : 0}
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
