import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Moon, Smartphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine 
} from 'recharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, subWeeks, subMonths, addWeeks, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type ViewMode = 'weekly' | 'monthly';
type ProgressFilter = 'habit' | 'goal';

export const AnalyticsPage = () => {
  const { dailyTracking, settings, habits, goals, habitChecks, getDailyProgress } = useAppStore();
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  
  const [sleepViewMode, setSleepViewMode] = useState<ViewMode>('weekly');
  const [phoneViewMode, setPhoneViewMode] = useState<ViewMode>('weekly');
  const [sleepOffset, setSleepOffset] = useState(0);
  const [phoneOffset, setPhoneOffset] = useState(0);
  
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('habit');
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(habits[0]?.id || null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(goals[0]?.id || null);
  const [progressViewMode, setProgressViewMode] = useState<ViewMode>('weekly');
  const [progressOffset, setProgressOffset] = useState(0);

  // Get date range based on view mode and offset
  const getDateRange = (viewMode: ViewMode, offset: number) => {
    const now = new Date();
    let start: Date, end: Date;
    
    if (viewMode === 'weekly') {
      const baseDate = offset < 0 ? subWeeks(now, Math.abs(offset)) : addWeeks(now, offset);
      start = startOfWeek(baseDate, { weekStartsOn: 1 });
      end = endOfWeek(baseDate, { weekStartsOn: 1 });
    } else {
      const baseDate = offset < 0 ? subMonths(now, Math.abs(offset)) : addMonths(now, offset);
      start = startOfMonth(baseDate);
      end = endOfMonth(baseDate);
    }
    
    return eachDayOfInterval({ start, end });
  };

  // Prepare sleep chart data
  const sleepChartData = useMemo(() => {
    const dates = getDateRange(sleepViewMode, sleepOffset);
    return dates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const tracking = dailyTracking.find(t => t.date === dateStr);
      return {
        date: format(date, sleepViewMode === 'weekly' ? 'EEE' : 'dd', { locale: ptBR }),
        fullDate: dateStr,
        value: tracking?.sleepHours || null,
        belowMin: tracking?.sleepHours !== undefined && tracking.sleepHours < (settings?.minSleepHours || 7),
      };
    });
  }, [dailyTracking, sleepViewMode, sleepOffset, settings?.minSleepHours]);

  // Prepare phone chart data
  const phoneChartData = useMemo(() => {
    const dates = getDateRange(phoneViewMode, phoneOffset);
    return dates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const tracking = dailyTracking.find(t => t.date === dateStr);
      return {
        date: format(date, phoneViewMode === 'weekly' ? 'EEE' : 'dd', { locale: ptBR }),
        fullDate: dateStr,
        value: tracking?.phoneHours || null,
        aboveMax: tracking?.phoneHours !== undefined && tracking.phoneHours > (settings?.maxPhoneHours || 3),
      };
    });
  }, [dailyTracking, phoneViewMode, phoneOffset, settings?.maxPhoneHours]);

  // Prepare progress chart data
  const progressChartData = useMemo(() => {
    const dates = getDateRange(progressViewMode, progressOffset);
    return dates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      let value = 0;
      
      if (progressFilter === 'habit' && selectedHabitId) {
        const check = habitChecks.find(hc => hc.habitId === selectedHabitId && hc.date === dateStr);
        value = check?.completed ? 100 : 0;
      } else if (progressFilter === 'goal') {
        value = getDailyProgress(dateStr);
      }
      
      return {
        date: format(date, progressViewMode === 'weekly' ? 'EEE' : 'dd', { locale: ptBR }),
        fullDate: dateStr,
        value,
      };
    });
  }, [progressViewMode, progressOffset, progressFilter, selectedHabitId, selectedGoalId, habitChecks, getDailyProgress]);

  const getPeriodLabel = (viewMode: ViewMode, offset: number) => {
    const now = new Date();
    if (viewMode === 'weekly') {
      const baseDate = offset < 0 ? subWeeks(now, Math.abs(offset)) : addWeeks(now, offset);
      const start = startOfWeek(baseDate, { weekStartsOn: 1 });
      const end = endOfWeek(baseDate, { weekStartsOn: 1 });
      return `${format(start, 'dd MMM', { locale: ptBR })} - ${format(end, 'dd MMM', { locale: ptBR })}`;
    } else {
      const baseDate = offset < 0 ? subMonths(now, Math.abs(offset)) : addMonths(now, offset);
      return format(baseDate, 'MMMM yyyy', { locale: ptBR });
    }
  };

  const minSleepHours = settings?.minSleepHours || 7;
  const maxPhoneHours = settings?.maxPhoneHours || 3;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen p-4 ${isDesktop ? 'pb-8 pt-6' : 'pb-20'}`}
    >
      <header className="mb-6">
        <h1 className={`font-bold text-gradient-primary ${isDesktop ? 'text-3xl' : 'text-2xl'}`}>Análises</h1>
        <p className="text-muted-foreground">Acompanhe suas estatísticas</p>
      </header>

      {/* Sleep & Phone Charts */}
      <div className={`${isDesktop ? 'grid grid-cols-2 gap-4' : 'space-y-4'} mb-6`}>
        {/* Sleep Chart */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Moon className="w-4 h-4 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">Horas de Sono</h3>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSleepViewMode('weekly')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                  sleepViewMode === 'weekly' ? 'gradient-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground'
                )}
              >
                Semana
              </button>
              <button
                onClick={() => setSleepViewMode('monthly')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                  sleepViewMode === 'monthly' ? 'gradient-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground'
                )}
              >
                Mês
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSleepOffset(sleepOffset - 1)}
              className="p-2 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="text-sm text-muted-foreground capitalize">
              {getPeriodLabel(sleepViewMode, sleepOffset)}
            </span>
            <button
              onClick={() => setSleepOffset(Math.min(0, sleepOffset + 1))}
              disabled={sleepOffset >= 0}
              className={cn(
                'p-2 rounded-lg transition-colors',
                sleepOffset >= 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-muted/30'
              )}
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sleepChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  domain={[0, 12]}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(v) => `${v}h`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: any) => [`${value}h`, 'Horas']}
                />
                <ReferenceLine 
                  y={minSleepHours} 
                  stroke="hsl(0 80% 55%)" 
                  strokeDasharray="5 5" 
                  label={{ value: `Mín: ${minSleepHours}h`, fill: 'hsl(0 80% 55%)', fontSize: 10 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Phone Chart */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">Tempo de Celular</h3>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPhoneViewMode('weekly')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                  phoneViewMode === 'weekly' ? 'gradient-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground'
                )}
              >
                Semana
              </button>
              <button
                onClick={() => setPhoneViewMode('monthly')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                  phoneViewMode === 'monthly' ? 'gradient-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground'
                )}
              >
                Mês
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setPhoneOffset(phoneOffset - 1)}
              className="p-2 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="text-sm text-muted-foreground capitalize">
              {getPeriodLabel(phoneViewMode, phoneOffset)}
            </span>
            <button
              onClick={() => setPhoneOffset(Math.min(0, phoneOffset + 1))}
              disabled={phoneOffset >= 0}
              className={cn(
                'p-2 rounded-lg transition-colors',
                phoneOffset >= 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-muted/30'
              )}
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={phoneChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  domain={[0, 10]}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(v) => `${v}h`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: any) => [`${value}h`, 'Horas']}
                />
                <ReferenceLine 
                  y={maxPhoneHours} 
                  stroke="hsl(0 80% 55%)" 
                  strokeDasharray="5 5" 
                  label={{ value: `Máx: ${maxPhoneHours}h`, fill: 'hsl(0 80% 55%)', fontSize: 10 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Progresso</h3>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setProgressFilter('habit')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                progressFilter === 'habit' ? 'gradient-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground'
              )}
            >
              Hábito
            </button>
            <button
              onClick={() => setProgressFilter('goal')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                progressFilter === 'goal' ? 'gradient-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground'
              )}
            >
              Objetivo
            </button>
          </div>
        </div>

        {/* Sub-filter */}
        <div className="mb-4">
          {progressFilter === 'habit' ? (
            <select
              value={selectedHabitId || ''}
              onChange={(e) => setSelectedHabitId(e.target.value)}
              className="w-full bg-muted/30 border border-border/50 rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              {habits.length === 0 ? (
                <option value="">Nenhum hábito criado</option>
              ) : (
                habits.map((habit) => (
                  <option key={habit.id} value={habit.id}>
                    {habit.emoji && `${habit.emoji} `}{habit.name}
                  </option>
                ))
              )}
            </select>
          ) : (
            <select
              value={selectedGoalId || ''}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="w-full bg-muted/30 border border-border/50 rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              {goals.length === 0 ? (
                <option value="">Nenhum objetivo criado</option>
              ) : (
                goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.emoji && `${goal.emoji} `}{goal.name}
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setProgressViewMode('weekly')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                progressViewMode === 'weekly' ? 'gradient-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground'
              )}
            >
              Semana
            </button>
            <button
              onClick={() => setProgressViewMode('monthly')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                progressViewMode === 'monthly' ? 'gradient-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground'
              )}
            >
              Mês
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setProgressOffset(progressOffset - 1)}
              className="p-2 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="text-sm text-muted-foreground capitalize">
              {getPeriodLabel(progressViewMode, progressOffset)}
            </span>
            <button
              onClick={() => setProgressOffset(Math.min(0, progressOffset + 1))}
              disabled={progressOffset >= 0}
              className={cn(
                'p-2 rounded-lg transition-colors',
                progressOffset >= 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-muted/30'
              )}
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Progress Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                formatter={(value: any) => [`${value}%`, 'Progresso']}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};
