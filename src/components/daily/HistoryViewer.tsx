import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
    calculateHierarchicalPeriodProgress,
    getPeriodIdentifier,
} from '@/utils/habitInstanceCalculator';
import { formatPercentage, calculateRawPercentage } from '@/utils/formatPercentage';
import { subDays, subWeeks, subMonths, subQuarters, subYears, format, isBefore, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';
import { ProgressDisplayMode } from '@/types';

type PeriodFilter = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semestral' | 'yearly';

interface HistoryViewerProps {
    displayMode?: ProgressDisplayMode;
}

// ── Circular item ──
const CircularItem = ({ value, label, delay = 0 }: { value: number; label: string; delay?: number }) => {
    const size = 48;
    const r = 19;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (value / 100) * circumference;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
            className="flex flex-col items-center"
        >
            <div style={{ width: size, height: size }} className="relative">
                <svg className="w-full h-full -rotate-90">
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--muted) / 0.3)" strokeWidth={2.5} />
                    <motion.circle
                        cx={cx} cy={cy} r={r} fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: delay + 0.05 }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-foreground">{formatPercentage(value)}</span>
                </div>
            </div>
            <span className="text-[9px] text-muted-foreground mt-0.5 text-center leading-tight max-w-[52px] truncate">{label}</span>
        </motion.div>
    );
};

// ── Linear item ──
const LinearItem = ({ value, label, delay = 0 }: { value: number; label: string; delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="flex flex-col gap-0.5 min-w-[52px] flex-1"
    >
        <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground truncate max-w-[40px]">{label}</span>
            <span className="text-[10px] font-bold text-foreground">{formatPercentage(value)}</span>
        </div>
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--gradient-progress)' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(value, 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: delay + 0.05 }}
            />
        </div>
    </motion.div>
);

export const HistoryViewer = ({ displayMode }: HistoryViewerProps) => {
    const { habits, goals, habitChecks, getDailyProgress } = useAppStore();
    const { isMobile } = useResponsive();
    const [filter, setFilter] = useState<PeriodFilter>('weekly');
    const [page, setPage] = useState(0); // 0 = current period page
    const pageSize = 6; // items per page (fits nicely horizontal)

    const isCircular = displayMode === 'circular';

    // Find the earliest habit creation date as the boundary
    const earliestDate = useMemo(() => {
        if (!habits || habits.length === 0) return new Date();
        const dates = habits
            .filter(h => h.createdAt)
            .map(h => parseISO(h.createdAt));
        if (dates.length === 0) return new Date();
        return dates.reduce((min, d) => isBefore(d, min) ? d : min, dates[0]);
    }, [habits]);

    // Generate history data: page 0 = most recent, going backwards
    const historyData = useMemo(() => {
        const data: { label: string; progress: number }[] = [];
        const today = new Date();
        const startIdx = page * pageSize;

        for (let i = startIdx; i < startIdx + pageSize; i++) {
            let date: Date;
            let label = '';
            let progress = 0;

            switch (filter) {
                case 'daily':
                    date = subDays(today, i);
                    if (isBefore(date, startOfDay(earliestDate))) continue;
                    label = format(date, "dd/MM", { locale: ptBR });
                    progress = getDailyProgress(format(date, 'yyyy-MM-dd'));
                    break;
                case 'weekly': {
                    date = subWeeks(today, i);
                    if (isBefore(date, earliestDate)) continue;
                    const wId = getPeriodIdentifier(date, 'weekly');
                    label = i === 0 ? 'Atual' : `S-${i}`;
                    const w = calculateHierarchicalPeriodProgress('weekly', wId, habits, goals, habitChecks);
                    progress = calculateRawPercentage(w.completed, w.total);
                    break;
                }
                case 'monthly': {
                    date = subMonths(today, i);
                    if (isBefore(date, earliestDate)) continue;
                    const mId = getPeriodIdentifier(date, 'monthly');
                    label = format(date, "MMM yy", { locale: ptBR });
                    const m = calculateHierarchicalPeriodProgress('monthly', mId, habits, goals, habitChecks);
                    progress = calculateRawPercentage(m.completed, m.total);
                    break;
                }
                case 'quarterly': {
                    date = subQuarters(today, i);
                    if (isBefore(date, earliestDate)) continue;
                    const qId = getPeriodIdentifier(date, 'quarterly');
                    const q = Math.ceil((date.getMonth() + 1) / 3);
                    label = `T${q}/${date.getFullYear() % 100}`;
                    const qr = calculateHierarchicalPeriodProgress('quarterly', qId, habits, goals, habitChecks);
                    progress = calculateRawPercentage(qr.completed, qr.total);
                    break;
                }
                case 'semestral': {
                    date = subMonths(today, i * 6);
                    if (isBefore(date, earliestDate)) continue;
                    const sId = getPeriodIdentifier(date, 'semestral');
                    const sem = date.getMonth() < 6 ? 1 : 2;
                    label = `${sem}°S/${date.getFullYear() % 100}`;
                    const s = calculateHierarchicalPeriodProgress('semestral', sId, habits, goals, habitChecks);
                    progress = calculateRawPercentage(s.completed, s.total);
                    break;
                }
                case 'yearly': {
                    date = subYears(today, i);
                    if (isBefore(date, earliestDate)) continue;
                    const yId = getPeriodIdentifier(date, 'yearly');
                    label = `${date.getFullYear()}`;
                    const y = calculateHierarchicalPeriodProgress('yearly', yId, habits, goals, habitChecks);
                    progress = calculateRawPercentage(y.completed, y.total);
                    break;
                }
            }

            data.push({ label, progress });
        }

        return data.reverse();
    }, [filter, page, habits, goals, habitChecks, earliestDate, getDailyProgress]);

    const hasMorePages = historyData.length === pageSize;

    const filterLabels: Record<PeriodFilter, string> = {
        daily: 'Dias',
        weekly: 'Semanas',
        monthly: 'Meses',
        quarterly: 'Trimestres',
        semestral: 'Semestres',
        yearly: 'Anos',
    };

    return (
        <div className="w-full mt-4">
            {/* Filter tabs + navigation */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1.5 overflow-x-auto scrollbar-thin">
                    {(Object.keys(filterLabels) as PeriodFilter[]).map(f => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setPage(0); }}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap",
                                filter === f
                                    ? "bg-primary/20 text-primary border border-primary/30"
                                    : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                            )}
                        >
                            {filterLabels[f]}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1 ml-2">
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={!hasMorePages}
                        className="p-1 rounded-lg hover:bg-muted/50 disabled:opacity-20 transition-all"
                        title="Períodos anteriores"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="p-1 rounded-lg hover:bg-muted/50 disabled:opacity-20 transition-all"
                        title="Períodos recentes"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Horizontal progress items */}
            <div className={cn(
                'flex justify-center',
                isCircular
                    ? (isMobile ? 'gap-2' : 'gap-3')
                    : (isMobile ? 'gap-1.5' : 'gap-2.5')
            )}>
                {historyData.length > 0 ? (
                    historyData.map((item, idx) =>
                        isCircular ? (
                            <CircularItem key={idx} value={item.progress} label={item.label} delay={idx * 0.04} />
                        ) : (
                            <LinearItem key={idx} value={item.progress} label={item.label} delay={idx * 0.04} />
                        )
                    )
                ) : (
                    <div className="text-center py-3 text-muted-foreground text-xs w-full">
                        Sem dados para este período
                    </div>
                )}
            </div>
        </div>
    );
};
