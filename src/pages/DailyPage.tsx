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
  
  // Analytics charts toggle - controls ALL charts/sections
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
        'min-h-screen flex flex-col',
        isDesktop ? 'pb-24' : 'pb-20'
      )}
    >
      {/* Header - flat, no glass background */}
      <UniversalHeader />

      <div className={cn(
        'px-4 pt-2 pb-4 flex-1 flex flex-col',
        isDesktop && 'max-w-6xl mx-auto w-full'
      )}>
        
        {/* ===== MAIN CENTRAL BOX ===== */}
        <div className={cn(
          "glass-card rounded-2xl p-6 max-w-4xl mx-auto w-full",
          !showCharts && "my-auto"
        )}>
          {/* Greeting */}
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-6">
            Olá, {useAppStore.getState().user?.firstName || 'Usuário'}
          </h1>

          {/* Day Card + Content */}
          <div className="flex flex-col items-center">
            {/* Day Card - centered */}
            <div className="flex justify-center w-full">
              <DayCard />
            </div>

            {/* Period Progress Indicators */}
            <div className="w-full mt-6">
              <div className="flex items-center justify-end mb-2">
                <ProgressDisplayToggle mode={localDisplayMode} onToggle={toggleDisplayMode} />
              </div>
              <PeriodProgressIndicators displayMode={localDisplayMode} />
            </div>

            {/* Charts below percentages - only when toggled */}
            <AnimatePresence>
              {showCharts && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="w-full mt-4 overflow-hidden"
                >
                  <div className={cn(
                    "grid gap-4",
                    isDesktop ? "grid-cols-2" : "grid-cols-1"
                  )}>
                    <div className="glass-card rounded-2xl p-4">
                      <EvolutionChart compact />
                    </div>
                    <div className="glass-card rounded-2xl p-4">
                      <ProgressCharts compact hideEmoji />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analytics Toggle Button - emoji only with glass style */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowCharts(prev => !prev)}
              className={cn(
                "mt-5 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                showCharts 
                  ? "gradient-primary text-primary-foreground" 
                  : "glass-card hover:border-primary/40"
              )}
            >
              <BarChart3 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* ===== BELOW SECTIONS - Only visible when charts toggled ===== */}
        <AnimatePresence>
          {showCharts && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="space-y-6 overflow-hidden mt-6 max-w-4xl mx-auto w-full"
            >
              {/* ===== GOALS, RADAR & HABITS SUMMARY ===== */}
              <GoalsHabitsSummary />

              {/* ===== HEALTH CHARTS ROW ===== */}
              <div className={cn(
                "grid gap-4",
                isDesktop ? "grid-cols-2" : "grid-cols-1"
              )}>
                <SleepChartMini />
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
            </motion.div>
          )}
        </AnimatePresence>
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
