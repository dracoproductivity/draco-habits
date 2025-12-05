import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, Target } from 'lucide-react';

export const AnalyticsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-20 p-4"
    >
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gradient-primary">Análises</h1>
        <p className="text-muted-foreground">Acompanhe suas estatísticas</p>
      </header>

      {/* Placeholder cards */}
      <div className="space-y-4">
        <div className="glass-hover rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Progresso Geral</h3>
            <p className="text-sm text-muted-foreground">Em breve</p>
          </div>
        </div>

        <div className="glass-hover rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Calendar className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Histórico Mensal</h3>
            <p className="text-sm text-muted-foreground">Em breve</p>
          </div>
        </div>

        <div className="glass-hover rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Target className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Metas Alcançadas</h3>
            <p className="text-sm text-muted-foreground">Em breve</p>
          </div>
        </div>

        <div className="glass-hover rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Comparativo</h3>
            <p className="text-sm text-muted-foreground">Em breve</p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-muted-foreground text-sm">
          🚧 Esta seção está em desenvolvimento
        </p>
      </div>
    </motion.div>
  );
};
