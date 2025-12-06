import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { PeriodCard } from '@/components/year/PeriodCard';
import { PeriodModal } from '@/components/year/PeriodModal';
import { GoalType } from '@/types';

const QUARTER_MONTHS: Record<number, string> = {
  1: 'Janeiro, Fevereiro, Março',
  2: 'Abril, Maio, Junho',
  3: 'Julho, Agosto, Setembro',
  4: 'Outubro, Novembro, Dezembro',
};

const QUARTER_MONTH_ARRAYS: Record<number, string[]> = {
  1: ['Janeiro', 'Fevereiro', 'Março'],
  2: ['Abril', 'Maio', 'Junho'],
  3: ['Julho', 'Agosto', 'Setembro'],
  4: ['Outubro', 'Novembro', 'Dezembro'],
};

export const AnnualProgressView = () => {
  const { goals, habits } = useAppStore();
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
  const year = displayYear;
  const month = today.toLocaleDateString('pt-BR', { month: 'long' });
  const weekNumber = Math.ceil(
    (today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  
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
      
      <div className={`${isDesktop ? 'grid grid-cols-2 gap-4' : 'space-y-3'}`}>
        {/* Week - only show for current year */}
        {!isViewingNextYear && (
          <PeriodCard
            title="Semana"
            subtitle="Semana atual"
            type="weekly"
            period={`Semana ${weekNumber} - ${currentYear}`}
            displayYear={currentYear}
            onClick={() => openPeriodModal('Semana', 'weekly', `Semana ${weekNumber} - ${currentYear}`, 'Semana atual')}
          />
        )}
        
        {/* Month - only show for current year */}
        {!isViewingNextYear && (
          <PeriodCard
            title={month.charAt(0).toUpperCase() + month.slice(1)}
            subtitle="Mês atual"
            type="monthly"
            period={`${month.charAt(0).toUpperCase() + month.slice(1)} ${currentYear}`}
            displayYear={currentYear}
            onClick={() => openPeriodModal(month.charAt(0).toUpperCase() + month.slice(1), 'monthly', `${month.charAt(0).toUpperCase() + month.slice(1)} ${currentYear}`, 'Mês atual')}
          />
        )}

        {/* Quarters */}
        {[1, 2, 3, 4].map((q) => (
          <PeriodCard
            key={q}
            title={`${q}º Trimestre`}
            subtitle={QUARTER_MONTHS[q]}
            type="quarterly"
            period={`${q}º Tri - ${year}`}
            quarterMonths={QUARTER_MONTH_ARRAYS[q]}
            displayYear={year}
            onClick={() => openPeriodModal(`${q}º Trimestre`, 'quarterly', `${q}º Tri - ${year}`, QUARTER_MONTHS[q], QUARTER_MONTH_ARRAYS[q])}
          />
        ))}

        {/* Year */}
        <PeriodCard
          title={`Ano ${year}`}
          type="yearly"
          period={year.toString()}
          displayYear={year}
          onClick={() => openPeriodModal(`Ano ${year}`, 'yearly', year.toString())}
        />
      </div>
      
      {/* Button to view next year */}
      {!isViewingNextYear && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setDisplayYear(currentYear + 1)}
          className="w-full mt-4 py-3 px-4 rounded-xl bg-muted/30 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex items-center justify-center gap-2"
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
