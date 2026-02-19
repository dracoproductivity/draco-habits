import { useMemo, useState } from 'react';
import { Moon, Smartphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addWeeks, subWeeks, addMonths, subMonths, isSameWeek, isSameMonth } from 'date-fns';
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
import { cn } from '@/lib/utils';

type PeriodType = 'week' | 'month';

const CompactTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    if (val === null) return null;
    const hours = Math.floor(val);
    const minutes = Math.round((val - hours) * 60);
    return (
      <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">
          {hours}h{minutes > 0 ? ` ${minutes}min` : ''}
        </p>
      </div>
    );
  }
  return null;
};

const usePeriodNavigation = (periodType: PeriodType) => {
  const [offset, setOffset] = useState(0);
  
  const baseDate = useMemo(() => {
    const now = new Date();
    if (periodType === 'week') {
      return offset === 0 ? now : (offset > 0 ? addWeeks(now, offset) : subWeeks(now, Math.abs(offset)));
    } else {
      return offset === 0 ? now : (offset > 0 ? addMonths(now, offset) : subMonths(now, Math.abs(offset)));
    }
  }, [offset, periodType]);

  const goBack = () => setOffset(o => o - 1);
  const goForward = () => setOffset(o => o + 1);
  const goToNow = () => setOffset(0);
  const isCurrentPeriod = offset === 0;

  const label = useMemo(() => {
    if (periodType === 'week') {
      const start = startOfWeek(baseDate, { weekStartsOn: 1 });
      const end = endOfWeek(baseDate, { weekStartsOn: 1 });
      return `${format(start, 'd MMM', { locale: ptBR })} - ${format(end, 'd MMM', { locale: ptBR })}`;
    } else {
      return format(baseDate, 'MMMM yyyy', { locale: ptBR });
    }
  }, [baseDate, periodType]);

  return { baseDate, goBack, goForward, goToNow, isCurrentPeriod, label, setOffset };
};

interface HealthChartProps {
  onRegisterClick?: () => void;
}

export const SleepChartMini = ({ onRegisterClick }: HealthChartProps) => {
  const { dailyLogs, settings } = useAppStore();
  const minSleepHours = settings.minSleepHours || 7;
  const [periodType, setPeriodType] = useState<PeriodType>('week');
  const { baseDate, goBack, goForward, goToNow, isCurrentPeriod, label, setOffset } = usePeriodNavigation(periodType);

  const data = useMemo(() => {
    let days: Date[];
    if (periodType === 'week') {
      const start = startOfWeek(baseDate, { weekStartsOn: 1 });
      const end = endOfWeek(baseDate, { weekStartsOn: 1 });
      days = eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(baseDate);
      const end = endOfMonth(baseDate);
      days = eachDayOfInterval({ start, end });
    }

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const log = dailyLogs.find(l => l.date === dateStr);
      return {
        name: periodType === 'week' 
          ? format(day, 'EEE', { locale: ptBR })
          : format(day, 'd'),
        hours: log?.sleepHours ?? null,
      };
    });
  }, [dailyLogs, baseDate, periodType]);

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-foreground">Sono</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setPeriodType('week'); setOffset(0); }}
            className={cn('px-2 py-0.5 text-[10px] rounded-md font-medium', periodType === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50')}
          >Sem</button>
          <button
            onClick={() => { setPeriodType('month'); setOffset(0); }}
            className={cn('px-2 py-0.5 text-[10px] rounded-md font-medium', periodType === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50')}
          >Mês</button>
        </div>
      </div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={goBack} className="p-1 text-muted-foreground hover:text-foreground"><ChevronLeft className="w-3.5 h-3.5" /></button>
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          {!isCurrentPeriod && (
            <button onClick={goToNow} className="px-1.5 py-0.5 text-[9px] text-primary bg-primary/10 rounded font-medium">Atual</button>
          )}
          <button onClick={goForward} className="p-1 text-muted-foreground hover:text-foreground"><ChevronRight className="w-3.5 h-3.5" /></button>
        </div>
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

export const PhoneChartMini = ({ onRegisterClick }: HealthChartProps) => {
  const { dailyLogs, settings } = useAppStore();
  const maxPhoneHours = settings.maxPhoneHours || 2;
  const [periodType, setPeriodType] = useState<PeriodType>('week');
  const { baseDate, goBack, goForward, goToNow, isCurrentPeriod, label, setOffset } = usePeriodNavigation(periodType);

  const data = useMemo(() => {
    let days: Date[];
    if (periodType === 'week') {
      const start = startOfWeek(baseDate, { weekStartsOn: 1 });
      const end = endOfWeek(baseDate, { weekStartsOn: 1 });
      days = eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(baseDate);
      const end = endOfMonth(baseDate);
      days = eachDayOfInterval({ start, end });
    }

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const log = dailyLogs.find(l => l.date === dateStr);
      return {
        name: periodType === 'week'
          ? format(day, 'EEE', { locale: ptBR })
          : format(day, 'd'),
        hours: log?.phoneUsageHours ?? null,
      };
    });
  }, [dailyLogs, baseDate, periodType]);

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-semibold text-foreground">Celular</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setPeriodType('week'); setOffset(0); }}
            className={cn('px-2 py-0.5 text-[10px] rounded-md font-medium', periodType === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50')}
          >Sem</button>
          <button
            onClick={() => { setPeriodType('month'); setOffset(0); }}
            className={cn('px-2 py-0.5 text-[10px] rounded-md font-medium', periodType === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50')}
          >Mês</button>
        </div>
      </div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={goBack} className="p-1 text-muted-foreground hover:text-foreground"><ChevronLeft className="w-3.5 h-3.5" /></button>
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          {!isCurrentPeriod && (
            <button onClick={goToNow} className="px-1.5 py-0.5 text-[9px] text-primary bg-primary/10 rounded font-medium">Atual</button>
          )}
          <button onClick={goForward} className="p-1 text-muted-foreground hover:text-foreground"><ChevronRight className="w-3.5 h-3.5" /></button>
        </div>
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
