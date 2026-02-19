import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import { GoalType } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import {
    calculatePeriodXN,
    getPeriodIdentifier,
    getPeriodBoundaries
} from '@/utils/habitInstanceCalculator';
import { startOfYear, subDays, subWeeks, subMonths, subQuarters, subYears, format, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';

type PeriodFilter = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semestral' | 'yearly';

export const HistoryViewer = () => {
    const { habits, goals, habitChecks, settings, getDailyProgress } = useAppStore();
    const { isMobile } = useResponsive();
    const [filter, setFilter] = useState<PeriodFilter>('daily');
    const [page, setPage] = useState(0); // 0 = current/latest page
    const pageSize = 10;

    const accountCreatedAt = useMemo(() => {
        return settings.accountCreatedAt ? parseISO(settings.accountCreatedAt) : new Date(2025, 0, 1);
    }, [settings.accountCreatedAt]);

    // Generate history data based on filter and page
    const historyData = useMemo(() => {
        const data: { label: string; progress: number; periodKey: string }[] = [];
        const today = new Date();

        // Calculate total needed items to try (to account for boundary)
        // We strictly just go back N steps.
        const startIndex = page * pageSize;
        const endIndex = startIndex + pageSize;

        for (let i = startIndex; i < endIndex; i++) {
            let date = today;
            let label = '';
            let periodKey = '';
            let periodType: GoalType = 'daily' as GoalType; // Cast for daily hack

            // Adjust date based on offset i
            switch (filter) {
                case 'daily':
                    date = subDays(today, i);
                    if (isBefore(date, accountCreatedAt) && i > 0) break; // Stop if before creation (allow today)
                    label = format(date, "dd 'de' MMM", { locale: ptBR });
                    // For daily, we can use getDailyProgress or calculate locally
                    // Using getDailyProgress might be faster if store has it, but it calculates on fly
                    // Let's use getDailyProgress(format(date, 'yyyy-MM-dd'))
                    break;
                case 'weekly':
                    date = subWeeks(today, i);
                    periodType = 'weekly';
                    break;
                case 'monthly':
                    date = subMonths(today, i);
                    periodType = 'monthly';
                    break;
                case 'quarterly':
                    date = subQuarters(today, i);
                    periodType = 'quarterly';
                    break;
                case 'semestral':
                    // Logic for semester subtraction is manual (6 months)
                    date = subMonths(today, i * 6);
                    periodType = 'semestral';
                    break;
                case 'yearly':
                    date = subYears(today, i);
                    periodType = 'yearly';
                    break;
            }

            // Boundary check
            if (filter !== 'daily') {
                // For periods, check if the END of the period is before creation? 
                // Or start?
                const boundaries = getPeriodBoundaries(periodType, getPeriodIdentifier(date, periodType));
                if (boundaries && isBefore(boundaries.end, accountCreatedAt)) continue;
            } else {
                if (isBefore(date, subDays(accountCreatedAt, 1))) continue;
            }

            let progress = 0;
            if (filter === 'daily') {
                const dateStr = format(date, 'yyyy-MM-dd');
                // We need to pass the date string to getDailyProgress
                // But getDailyProgress in store is for *today* or reactive?
                // It's a selector: getDailyProgress: (date: string) => number
                progress = getDailyProgress(dateStr);
                // Wait, store getDailyProgress uses current state. Correct.
            } else {
                // Use calculatePeriodXN
                const pId = getPeriodIdentifier(date, periodType);
                periodKey = pId;
                label = pId; // Improves label later
                const xn = calculatePeriodXN(periodType, pId, habits, goals, habitChecks);
                progress = xn.total > 0 ? Math.round((xn.completed / xn.total) * 100) : 0;
            }

            data.push({ label, progress, periodKey });
        }

        return data;
    }, [filter, page, habits, goals, habitChecks, accountCreatedAt, getDailyProgress]);

    const hasNextPage = historyData.length === pageSize; // Crude check. 
    // Better: check if next item exists.
    // Actually, if we hit the "accountCreatedAt" wall, data won't fill.
    // So valid check is: if we didn't fill the page, we are at end.

    return (
        <div className="w-full glass-card rounded-2xl p-4 mt-6">
            {/* Filters */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {(['daily', 'weekly', 'monthly', 'quarterly', 'semestral', 'yearly'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setPage(0); }}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                                filter === f
                                    ? "bg-primary/20 text-primary border border-primary/30"
                                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                            )}
                        >
                            {f === 'daily' ? 'Dias' :
                                f === 'weekly' ? 'Semanas' :
                                    f === 'monthly' ? 'Meses' :
                                        f === 'quarterly' ? 'Trimestres' :
                                            f === 'semestral' ? 'Semestres' : 'Anos'}
                        </button>
                    ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="p-1.5 rounded-lg hover:bg-muted/50 disabled:opacity-30 transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={historyData.length < pageSize} // If partial page, end reached
                        className="p-1.5 rounded-lg hover:bg-muted/50 disabled:opacity-30 transition-all"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-2">
                {historyData.length > 0 ? (
                    historyData.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-muted/10 hover:bg-muted/20 transition-all">
                            <span className="text-xs font-medium w-24 text-muted-foreground">{item.label}</span>
                            <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.progress}%` }}
                                    className="h-full bg-primary/80 rounded-full"
                                />
                            </div>
                            <span className="text-xs font-bold w-10 text-right">{item.progress}%</span>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-4 text-muted-foreground text-xs">
                        Sem dados para este período
                    </div>
                )}
            </div>
        </div>
    );
};
