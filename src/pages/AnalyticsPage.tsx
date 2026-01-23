import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Moon, Smartphone, Target, CalendarDays, BarChart3, Plus, Edit3 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
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
import { ProgressTimeline } from '@/components/daily/ProgressTimeline';
import { UniversalHeader } from '@/components/layout/UniversalHeader';
import { HealthLogModal } from '@/components/analytics/HealthLogModal';
import { cn } from '@/lib/utils';

type TimeRange = 'weekly' | 'monthly';
type AnalyticsView = 'progress' | 'charts';

export const AnalyticsPage = () => {
  const { settings, dailyLogs, habits, goals, habitChecks } = useAppStore();
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  const [analyticsView, setAnalyticsView] = useState<AnalyticsView>('progress');
  const [sleepTimeRange, setSleepTimeRange] = useState<TimeRange>('weekly');
  const [phoneTimeRange, setPhoneTimeRange] = useState<TimeRange>('weekly');
  
  // Health log modal state
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  
  // Check if today has logs
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayLog = dailyLogs.find(l => l.date === todayStr);
  const hasTodaySleep = todayLog?.sleepHours !== undefined && todayLog?.sleepHours !== null;
  const hasTodayPhone = todayLog?.phoneUsageHours !== undefined && todayLog?.phoneUsageHours !== null;

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
        status: log ? (log.sleepHours < minSleepHours ? 'bad' : log.sleepHours === minSleepHours ? 'warning' : 'good') : null,
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
        status: log ? (log.phoneUsageHours > maxPhoneHours ? 'bad' : log.phoneUsageHours === maxPhoneHours ? 'warning' : 'good') : null,
      };
    });
  }, [dailyLogs, phoneTimeRange, maxPhoneHours]);

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
              <div className="bg-muted/20 backdrop-blur-sm border border-border/30 rounded-2xl p-4">
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

                {/* Register/Edit Button */}
                <button
                  onClick={() => setShowSleepModal(true)}
                  className="w-full mb-3 py-2 px-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/30 text-sm text-foreground font-medium transition-all flex items-center justify-center gap-2"
                >
                  {hasTodaySleep ? (
                    <>
                      <Edit3 className="w-4 h-4" />
                      Alterar registro (hoje: {todayLog?.sleepHours}h)
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Registrar hoje
                    </>
                  )}
                </button>

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
                          // Colors: good (green) = above min, warning (yellow) = at min, bad (red) = below min
                          const colorMap = {
                            good: { fill: 'hsl(142 71% 45%)', stroke: 'hsl(142 71% 35%)' },
                            warning: { fill: 'hsl(45 93% 47%)', stroke: 'hsl(45 93% 37%)' },
                            bad: { fill: 'hsl(0 80% 55%)', stroke: 'hsl(0 80% 45%)' },
                          };
                          const colors = colorMap[payload.status as keyof typeof colorMap] || colorMap.good;
                          return (
                            <circle
                              key={`sleep-dot-${payload.date || payload.dayName}`}
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill={colors.fill}
                              stroke={colors.stroke}
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
              <div className="bg-muted/20 backdrop-blur-sm border border-border/30 rounded-2xl p-4">
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

                {/* Register/Edit Button */}
                <button
                  onClick={() => setShowPhoneModal(true)}
                  className="w-full mb-3 py-2 px-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/30 text-sm text-foreground font-medium transition-all flex items-center justify-center gap-2"
                >
                  {hasTodayPhone ? (
                    <>
                      <Edit3 className="w-4 h-4" />
                      Alterar registro (hoje: {todayLog?.phoneUsageHours}h)
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Registrar hoje
                    </>
                  )}
                </button>

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
                          // Colors: good (green) = below max, warning (yellow) = at max, bad (red) = above max
                          const colorMap = {
                            good: { fill: 'hsl(142 71% 45%)', stroke: 'hsl(142 71% 35%)' },
                            warning: { fill: 'hsl(45 93% 47%)', stroke: 'hsl(45 93% 37%)' },
                            bad: { fill: 'hsl(0 80% 55%)', stroke: 'hsl(0 80% 45%)' },
                          };
                          const colors = colorMap[payload.status as keyof typeof colorMap] || colorMap.good;
                          return (
                            <circle
                              key={`phone-dot-${payload.date || payload.dayName}`}
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill={colors.fill}
                              stroke={colors.stroke}
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

            {/* Evolution + Progress Timeline (same as Daily page) */}
            <ProgressTimeline />
          </>
        )}
      </div>
      
      {/* Health Log Modals */}
      <HealthLogModal
        isOpen={showSleepModal}
        onClose={() => setShowSleepModal(false)}
        type="sleep"
      />
      <HealthLogModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        type="phone"
      />
    </motion.div>
  );
};
