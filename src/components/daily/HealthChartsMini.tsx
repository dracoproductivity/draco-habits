import { useMemo } from 'react';
import { Moon, Smartphone } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const CompactTooltip = ({ active, payload, label }: any) => {
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

export const SleepChartMini = () => {
  const { dailyLogs, settings } = useAppStore();
  const minSleepHours = settings.minSleepHours || 7;

  const data = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const log = dailyLogs.find(l => l.date === dateStr);
      return {
        name: format(day, 'EEE', { locale: ptBR }),
        hours: log?.sleepHours ?? null,
      };
    });
  }, [dailyLogs, dailyLogs.length]);

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Moon className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-semibold text-foreground">Sono</span>
      </div>
      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 12]} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CompactTooltip />} />
            <ReferenceLine y={minSleepHours} stroke="hsl(0 70% 50%)" strokeDasharray="3 3" strokeOpacity={0.4} />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              connectNulls={false}
              dot={{ r: 3, fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const PhoneChartMini = () => {
  const { dailyLogs, settings } = useAppStore();
  const maxPhoneHours = settings.maxPhoneHours || 2;

  const data = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const log = dailyLogs.find(l => l.date === dateStr);
      return {
        name: format(day, 'EEE', { locale: ptBR }),
        hours: log?.phoneUsageHours ?? null,
      };
    });
  }, [dailyLogs, dailyLogs.length]);

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Smartphone className="w-4 h-4 text-orange-400" />
        <span className="text-xs font-semibold text-foreground">Celular</span>
      </div>
      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 12]} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CompactTooltip />} />
            <ReferenceLine y={maxPhoneHours} stroke="hsl(0 70% 50%)" strokeDasharray="3 3" strokeOpacity={0.4} />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              connectNulls={false}
              dot={{ r: 3, fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
