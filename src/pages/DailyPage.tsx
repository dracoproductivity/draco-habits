import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { UniversalHeader } from '@/components/layout/UniversalHeader';
import { DayCard } from '@/components/daily/DayCard';
import { PeriodProgressIndicators } from '@/components/daily/PeriodProgressIndicators';
import { ProgressDisplayToggle } from '@/components/ui/ProgressDisplayToggle';
import { GoalCompletionModal } from '@/components/modals/GoalCompletionModal';
import { FireCelebration } from '@/components/effects/FireCelebration';
import { EvolutionChart } from '@/components/daily/EvolutionChart';
import { ProgressCharts } from '@/components/charts/ProgressCharts';
import { GoalsHabitsSummary } from '@/components/daily/GoalsHabitsSummary';
import { SleepChartMini, PhoneChartMini } from '@/components/daily/HealthChartsMini';
import { CategoryRadarChart } from '@/components/charts/CategoryRadarChart';
import { AnnualProgressView } from '@/components/analytics/AnnualProgressView';
import { HabitCalendar } from '@/components/daily/HabitCalendar';
import { useResponsive } from '@/hooks/useResponsive';
import { useAppStore } from '@/store/useAppStore';
import { useGoalCompletionCheck } from '@/hooks/useGoalCompletionCheck';
import { cn } from '@/lib/utils';
import { ProgressDisplayMode, Goal } from '@/types';
import { formatLocalDate } from '@/utils/dateUtils';

export const DailyPage = () => {
  const { isDesktop } = useResponsive();
  const { settings, updateSettings, goals, habits, habitChecks, updateGoal, getDailyProgress } = useAppStore();
  
  // Analytics charts toggle
  const [showCharts, setShowCharts] = useState(false);
  
  // Goal completion modal state
  const [goalToComplete, setGoalToComplete] = useState<Goal | null>(null);
  const [processedGoalIds, setProcessedGoalIds] = useState<Set<string>>(new Set());
  
  // Fire celebration state
  const [showFireCelebration, setShowFireCelebration] = useState(false);
  const [lastCelebratedDate, setLastCelebratedDate] = useState<string | null>(null);
  
  // Check for 100% daily progress
  const todayStr = formatLocalDate(new Date());
  const dailyProgress = getDailyProgress(todayStr);
  
  useEffect(() => {
    if (dailyProgress === 100 && lastCelebratedDate !== todayStr) {
      setShowFireCelebration(true);
      setLastCelebratedDate(todayStr);
    }
  }, [dailyProgress, todayStr, lastCelebratedDate]);
  
  const handleFireCelebrationComplete = useCallback(() => {
    setShowFireCelebration(false);
  }, []);
  
  // Check for goals that need completion feedback
  const goalsNeedingCompletion = useGoalCompletionCheck({
    goals,
    habits,
    habitChecks,
    currentDate: new Date(),
  });
  
  useEffect(() => {
    const pendingGoal = goalsNeedingCompletion.find(
      g => g.needsCompletion && !processedGoalIds.has(g.goalId)
    );
    
    if (pendingGoal) {
      const goal = goals.find(g => g.id === pendingGoal.goalId);
      if (goal && !goal.completionStatus) {
        setGoalToComplete(goal);
      }
    }
  }, [goalsNeedingCompletion, goals, processedGoalIds]);
  
  const handleGoalCompletion = (status: 'completed' | 'failed') => {
    if (goalToComplete) {
      updateGoal(goalToComplete.id, { completionStatus: status });
      setProcessedGoalIds(prev => new Set(prev).add(goalToComplete.id));
      setGoalToComplete(null);
    }
  };
  
  // Per-page progress display mode
  const [localDisplayMode, setLocalDisplayMode] = useState<ProgressDisplayMode>(
    settings.pageProgressDisplayModes?.home || settings.progressDisplayMode
  );
  
  const toggleDisplayMode = () => {
    const newMode = localDisplayMode === 'linear' ? 'circular' : 'linear';
    setLocalDisplayMode(newMode);
    updateSettings({
      pageProgressDisplayModes: {
        ...settings.pageProgressDisplayModes,
        home: newMode,
        goals: settings.pageProgressDisplayModes?.goals || settings.progressDisplayMode,
        analytics: settings.pageProgressDisplayModes?.analytics || settings.progressDisplayMode,
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'min-h-screen',
        isDesktop ? 'pb-24' : 'pb-20'
      )}
    >
      {/* Header - flat, no glass background */}
      <UniversalHeader />

      <div className={cn('px-4 pt-2 pb-4 space-y-6', isDesktop && 'max-w-6xl mx-auto')}>
        
        {/* ===== MAIN CENTRAL BOX ===== */}
        <div className="glass-card rounded-2xl p-6">
          {/* Greeting */}
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-6">
            Olá, {useAppStore.getState().user?.firstName || 'Usuário'}
          </h1>

          {/* Day Card + Charts Area */}
          <div className="flex flex-col items-center">
            {/* Charts + Day Card Row */}
            <div className={cn(
              "flex items-start justify-center gap-4 w-full",
              !showCharts && "flex-col items-center"
            )}>
              {/* Left Chart - Constância (only when charts toggled) */}
              <AnimatePresence>
                {showCharts && (
                  <motion.div
                    initial={{ opacity: 0, x: -20, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: 'auto' }}
                    exit={{ opacity: 0, x: -20, width: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="flex-1 min-w-0 hidden lg:block"
                  >
                    <div className="glass-card rounded-2xl p-4">
                      <EvolutionChart compact />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Day Card - centered */}
              <div className={cn(
                "flex justify-center",
                showCharts ? "w-auto flex-shrink-0" : "w-full"
              )}>
                <DayCard />
              </div>

              {/* Right Chart - Progresso (only when charts toggled) */}
              <AnimatePresence>
                {showCharts && (
                  <motion.div
                    initial={{ opacity: 0, x: 20, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: 'auto' }}
                    exit={{ opacity: 0, x: 20, width: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="flex-1 min-w-0 hidden lg:block"
                  >
                    <div className="glass-card rounded-2xl p-4">
                      <ProgressCharts compact hideEmoji />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile charts - stacked below when toggled */}
            <AnimatePresence>
              {showCharts && !isDesktop && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full space-y-4 mt-4"
                >
                  <div className="glass-card rounded-2xl p-4">
                    <EvolutionChart compact />
                  </div>
                  <div className="glass-card rounded-2xl p-4">
                    <ProgressCharts compact hideEmoji />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Period Progress Indicators */}
            <div className="w-full mt-6">
              <div className="flex items-center justify-end mb-2">
                <ProgressDisplayToggle mode={localDisplayMode} onToggle={toggleDisplayMode} />
              </div>
              <PeriodProgressIndicators displayMode={localDisplayMode} />
            </div>

            {/* Analytics Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCharts(prev => !prev)}
              className={cn(
                "mt-5 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                showCharts 
                  ? "gradient-primary text-primary-foreground" 
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-border/30"
              )}
            >
              <BarChart3 className="w-4 h-4" />
              {showCharts ? 'Ocultar Gráficos' : 'Ver Gráficos'}
            </motion.button>
          </div>
        </div>

        {/* ===== GOALS & HABITS SUMMARY ===== */}
        <GoalsHabitsSummary />

        {/* ===== HEALTH CHARTS ROW ===== */}
        <div className={cn(
          "grid gap-4",
          isDesktop ? "grid-cols-3" : "grid-cols-1"
        )}>
          <SleepChartMini />
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-foreground">Categorias</span>
            </div>
            <CategoryRadarChart compact />
          </div>
          <PhoneChartMini />
        </div>

        {/* ===== ANNUAL PROGRESS ===== */}
        <div>
          <h2 className="font-semibold text-lg text-foreground mb-4">Progresso Anual</h2>
          <AnnualProgressView displayMode={localDisplayMode} />
        </div>

        {/* ===== CALENDAR ===== */}
        <div className="glass-card rounded-2xl">
          <HabitCalendar />
        </div>
      </div>
      
      {/* Goal Completion Modal */}
      {goalToComplete && (
        <GoalCompletionModal
          isOpen={!!goalToComplete}
          goal={goalToComplete}
          onComplete={handleGoalCompletion}
          onClose={() => {
            setProcessedGoalIds(prev => new Set(prev).add(goalToComplete.id));
            setGoalToComplete(null);
          }}
        />
      )}
      
      {/* Fire Celebration for 100% daily completion */}
      <FireCelebration 
        isActive={showFireCelebration} 
        onComplete={handleFireCelebrationComplete} 
      />
    </motion.div>
  );
};
