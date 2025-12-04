import { useState } from 'react';
import { motion } from 'framer-motion';
import { PeriodCard } from '@/components/year/PeriodCard';
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
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gradient-fire">Visão do Ano</h1>
        <p className="text-muted-foreground">Organize seus objetivos por período</p>
      </header>

      <div className="space-y-4">
        {/* Week and Month row */}
        <div className="grid grid-cols-2 gap-3">
          <PeriodCard
            title="Semana"
            type="weekly"
            period={`Semana ${weekNumber}`}
            onClick={() => openModal('Semana', 'weekly', `Semana ${weekNumber}`)}
          />
          <PeriodCard
            title={month.charAt(0).toUpperCase() + month.slice(1)}
            type="monthly"
            period={`${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`}
            onClick={() => openModal(month.charAt(0).toUpperCase() + month.slice(1), 'monthly', `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`)}
          />
        </div>

        {/* Quarters row */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((q) => (
            <PeriodCard
              key={q}
              title={`Trimestre ${q}`}
              subtitle={QUARTER_MONTHS[q]}
              type="quarterly"
              period={`Q${q}-${year}`}
              className={q !== quarter ? 'opacity-60' : ''}
              onClick={() => openModal(`Trimestre ${q}`, 'quarterly', `Q${q}-${year}`, QUARTER_MONTHS[q])}
            />
          ))}
        </div>

        {/* Year card */}
        <PeriodCard
          title={`Ano ${year}`}
          type="yearly"
          period={year.toString()}
          className="col-span-2"
          onClick={() => openModal(`Ano ${year}`, 'yearly', year.toString())}
        />
      </div>

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
