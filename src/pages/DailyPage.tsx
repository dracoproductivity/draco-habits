import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DailyHeader } from '@/components/daily/DailyHeader';
import { HabitList } from '@/components/daily/HabitList';
import { HabitCalendar } from '@/components/daily/HabitCalendar';
import { CategoryRadarChart } from '@/components/charts/CategoryRadarChart';
import { PeriodProgressIndicators } from '@/components/daily/PeriodProgressIndicators';
import { ProgressDisplayToggle } from '@/components/ui/ProgressDisplayToggle';
import { GoalCompletionModal } from '@/components/modals/GoalCompletionModal';
import { FireCelebration } from '@/components/effects/FireCelebration';
import { EvolutionChart } from '@/components/daily/EvolutionChart';
import { ProgressCharts } from '@/components/charts/ProgressCharts';
import { ProgressTimeline } from '@/components/daily/ProgressTimeline';
import { useResponsive } from '@/hooks/useResponsive';
import { useAppStore } from '@/store/useAppStore';
import { useGoalCompletionCheck } from '@/hooks/useGoalCompletionCheck';
import { cn } from '@/lib/utils';
import { ProgressDisplayMode, Goal } from '@/types';
import { formatLocalDate } from '@/utils/dateUtils';

export const DailyPage = () => {
  const { isDesktop, isTablet } = useResponsive();
  const { settings, updateSettings, goals, habits, habitChecks, updateGoal, getDailyProgress } = useAppStore();
  
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
    // Trigger fire celebration when daily progress hits 100%
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
  
  // Show modal for goals that need completion (only if not already processed)
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
    settings.pageProgressDisplayModes?.daily || settings.progressDisplayMode
  );
  
  const toggleDisplayMode = () => {
    const newMode = localDisplayMode === 'linear' ? 'circular' : 'linear';
    setLocalDisplayMode(newMode);
    updateSettings({
      pageProgressDisplayModes: {
        ...settings.pageProgressDisplayModes,
        daily: newMode,
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
        isDesktop ? 'pb-24 pt-6' : 'pb-20'
      )}
    >
      <DailyHeader />

      <div className={cn(
        'pt-2 pb-4',
        isDesktop ? 'px-0' : 'px-4'
      )}>
        {isDesktop ? (
          <>
            {/* Desktop: 3-column layout - Radar left | Habits center | Calendar right */}
            <div className="flex flex-col gap-6">
              {/* Top row: Radar (left) + Habits (center) + Calendar (right) */}
              <div className="grid grid-cols-3 gap-6" style={{ minHeight: '380px' }}>
                {/* Left column - Radar chart centered with habits */}
                <div className="glass-card rounded-2xl p-4 flex flex-col justify-center">
                  <div className="flex justify-center">
                    <div className="w-52">
                      <h3 className="font-medium text-muted-foreground text-sm mb-2 text-center">Categorias</h3>
                      <CategoryRadarChart className="h-[160px] w-full" compact />
                    </div>
                  </div>
                </div>
                
                {/* Middle column - Habits (centered title) */}
                <div className="glass-card rounded-2xl p-4 flex flex-col h-full">
                  <HabitList showProgressIndicators={false} centerTitle className="flex-1" />
                </div>
                
                {/* Right column - Calendar */}
                <div className="glass-card rounded-2xl p-4 flex flex-col justify-center">
                  <HabitCalendar />
                </div>
              </div>
              
              {/* Bottom row: Constância (left) + Porcentagens (center) + Progresso (right) */}
              <div className="grid grid-cols-3 gap-6 items-center">
                {/* Left - Constância chart (Evolution) */}
                <div className="glass-card rounded-2xl p-5" style={{ minHeight: '300px' }}>
                  <EvolutionChart compact />
                </div>
                
                {/* Center - Period progress indicators */}
                <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center">
                  <div className="flex items-center justify-end mb-2 w-full">
                    <ProgressDisplayToggle mode={localDisplayMode} onToggle={toggleDisplayMode} />
                  </div>
                  <div className="transform scale-90 origin-center">
                    <PeriodProgressIndicators displayMode={localDisplayMode} />
                  </div>
                </div>
                
                {/* Right - Progresso chart */}
                <div className="glass-card rounded-2xl p-5" style={{ minHeight: '300px' }}>
                  <ProgressCharts compact hideEmoji />
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Mobile/Tablet: Vertical stack */
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-4">
              <HabitList showProgressIndicators={false} centerTitle />
            </div>
            
            {/* Progress indicators with toggle */}
            <div className="glass-card rounded-2xl p-4 relative">
              <div className="absolute right-4 top-4">
                <ProgressDisplayToggle mode={localDisplayMode} onToggle={toggleDisplayMode} />
              </div>
              <PeriodProgressIndicators displayMode={localDisplayMode} />
            </div>
            
            {/* Radar chart */}
            <div className="glass-card rounded-2xl p-4 flex justify-center">
              <div className="w-48">
                <h4 className="font-medium text-muted-foreground text-sm mb-2 text-center">Categorias</h4>
                <CategoryRadarChart compact className="h-[140px] w-full" />
              </div>
            </div>
            
            <div className="glass-card rounded-2xl">
              <ProgressTimeline />
            </div>
            
            <div className="glass-card rounded-2xl p-4">
              <HabitCalendar />
            </div>
          </div>
        )}
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
