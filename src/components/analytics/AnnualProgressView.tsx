import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { PeriodCard } from '@/components/year/PeriodCard';
import { PeriodModal } from '@/components/year/PeriodModal';
import { HierarchicalYearProgress } from '@/components/analytics/HierarchicalYearProgress';
import { GoalType, ProgressDisplayMode } from '@/types';
import { getWeek } from 'date-fns';

interface AnnualProgressViewProps {
  displayMode?: ProgressDisplayMode;
}

export const AnnualProgressView = ({ displayMode }: AnnualProgressViewProps) => {
  const { goals, habits, settings } = useAppStore();
  const isDesktopScreen = typeof window !== 'undefined' && window.innerWidth >= 1024;
  
  // Use passed displayMode prop if available, otherwise fall back to settings
  const effectiveDisplayMode = displayMode || settings.pageProgressDisplayModes?.analytics || settings.progressDisplayMode;
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  
  const currentYear = new Date().getFullYear();
  const [displayYear, setDisplayYear] = useState(currentYear);
  const isViewingNextYear = displayYear === currentYear + 1;
  
  const [selectedPeriod, setSelectedPeriod] = useState<{
    title: string;
    subtitle?: string;
    type: GoalType;
    period: string;
    quarterMonths?: string[];
  } | null>(null);
  
  const today = new Date();
  const month = today.toLocaleDateString('pt-BR', { month: 'long' });
  // Use getWeek with weekStartsOn: 1 (Monday) to match getPeriodIdentifier
  const weekNumber = getWeek(today, { weekStartsOn: 1 });
  
  const isFirstTimeUser = goals.length === 0 && habits.length === 0;
  
  const openPeriodModal = (title: string, type: GoalType, period: string, subtitle?: string, quarterMonths?: string[]) => {
    setSelectedPeriod({ title, subtitle, type, period, quarterMonths });
  };

  return (
    <div>
      {isFirstTimeUser && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-primary/10 border border-primary/30 rounded-2xl mb-6"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl gradient-fire flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Comece sua jornada!</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Para começar, vá até a aba <strong>Diário</strong> e crie seu primeiro hábito. 
                Ao criar um hábito, você pode vinculá-lo a objetivos que serão criados automaticamente 
                (semanal, mensal, trimestral e anual). Seus objetivos aparecerão aqui!
              </p>
              <button
                onClick={() => {
                  const { setActiveTab } = useAppStore.getState();
                  setActiveTab('daily');
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Ir para o Diário →
              </button>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Year navigation header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg text-foreground">{displayYear}</h2>
        {isViewingNextYear && (
          <button
            onClick={() => setDisplayYear(currentYear)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar para {currentYear}
          </button>
        )}
      </div>
      
      {/* Week and Month cards side by side - only for current year */}
      {!isViewingNextYear && (
        <div className="grid grid-cols-2 gap-3 mb-4 max-w-3xl mx-auto">
          <PeriodCard
            title="Semana"
            subtitle="Semana atual"
            type="weekly"
            period={`Semana ${weekNumber} - ${currentYear}`}
            displayYear={currentYear}
            displayMode={effectiveDisplayMode}
            onClick={() => openPeriodModal('Semana', 'weekly', `Semana ${weekNumber} - ${currentYear}`, 'Semana atual')}
          />
          
          <PeriodCard
            title={month.charAt(0).toUpperCase() + month.slice(1)}
            subtitle="Mês atual"
            type="monthly"
            period={`${month.charAt(0).toUpperCase() + month.slice(1)} ${currentYear}`}
            displayYear={currentYear}
            displayMode={effectiveDisplayMode}
            onClick={() => openPeriodModal(month.charAt(0).toUpperCase() + month.slice(1), 'monthly', `${month.charAt(0).toUpperCase() + month.slice(1)} ${currentYear}`, 'Mês atual')}
          />
        </div>
      )}

      {/* Hierarchical Year Progress - Nested structure */}
      <HierarchicalYearProgress 
        displayYear={displayYear}
        displayMode={effectiveDisplayMode}
        onPeriodClick={(title, type, period, subtitle, quarterMonths) => 
          openPeriodModal(title, type, period, subtitle, quarterMonths)
        }
      />
      
      {/* Button to view next year */}
      {!isViewingNextYear && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setDisplayYear(currentYear + 1)}
          className="w-full max-w-3xl mx-auto mt-4 py-3 px-4 rounded-xl bg-muted/30 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex items-center justify-center gap-2"
        >
          <span>Ver objetivos de {currentYear + 1}</span>
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      )}

      {/* Period Modal */}
      {selectedPeriod && (
        <PeriodModal
          isOpen={!!selectedPeriod}
          onClose={() => setSelectedPeriod(null)}
          title={selectedPeriod.title}
          subtitle={selectedPeriod.subtitle}
          type={selectedPeriod.type}
          period={selectedPeriod.period}
          quarterMonths={selectedPeriod.quarterMonths}
        />
      )}
    </div>
  );
};
