import { useState } from 'react';
import { motion } from 'framer-motion';
import { PeriodItem } from '@/components/year/PeriodItem';
import { PeriodModal } from '@/components/year/PeriodModal';
import { GoalType } from '@/types';

const QUARTER_MONTHS: Record<number, string> = {
  1: 'Janeiro, Fevereiro, Março',
  2: 'Abril, Maio, Junho',
  3: 'Julho, Agosto, Setembro',
  4: 'Outubro, Novembro, Dezembro',
};

export const YearPage = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.toLocaleDateString('pt-BR', { month: 'long' });
  const weekNumber = Math.ceil(
    (today.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  const quarter = Math.ceil((today.getMonth() + 1) / 3);

  const [selectedPeriod, setSelectedPeriod] = useState<{
    title: string;
    subtitle?: string;
    type: GoalType;
    period: string;
  } | null>(null);

  const openModal = (title: string, type: GoalType, period: string, subtitle?: string) => {
    setSelectedPeriod({ title, subtitle, type, period });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-20 p-4"
    >
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gradient-fire">Visão do Ano</h1>
        <p className="text-muted-foreground">Organize seus objetivos por período</p>
      </header>

      {/* Week and Month */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <PeriodItem
          title="Semana"
          type="weekly"
          period={`Semana ${weekNumber}`}
          onClick={() => openModal('Semana', 'weekly', `Semana ${weekNumber}`)}
        />
        <PeriodItem
          title={month.charAt(0).toUpperCase() + month.slice(1)}
          type="monthly"
          period={`${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`}
          onClick={() => openModal(month.charAt(0).toUpperCase() + month.slice(1), 'monthly', `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`)}
        />
      </div>

      {/* Separator */}
      <div className="h-px bg-border/30 mb-6" />

      {/* Quarters */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {[1, 2, 3, 4].map((q) => (
          <PeriodItem
            key={q}
            title={`Trimestre ${q}`}
            subtitle={QUARTER_MONTHS[q]}
            type="quarterly"
            period={`${q}º Tri - ${year}`}
            className={q !== quarter ? 'opacity-50' : ''}
            onClick={() => openModal(`Trimestre ${q}`, 'quarterly', `${q}º Tri - ${year}`, QUARTER_MONTHS[q])}
          />
        ))}
      </div>

      {/* Separator */}
      <div className="h-px bg-border/30 mb-6" />

      {/* Year */}
      <PeriodItem
        title={`Ano ${year}`}
        type="yearly"
        period={year.toString()}
        onClick={() => openModal(`Ano ${year}`, 'yearly', year.toString())}
      />

      {/* Period Modal */}
      {selectedPeriod && (
        <PeriodModal
          isOpen={!!selectedPeriod}
          onClose={() => setSelectedPeriod(null)}
          title={selectedPeriod.title}
          subtitle={selectedPeriod.subtitle}
          type={selectedPeriod.type}
          period={selectedPeriod.period}
        />
      )}
    </motion.div>
  );
};
