import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Target, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { DracoIcon } from '@/components/icons/DracoIcon';

export const WelcomeModal = () => {
  const { showWelcomeModal, closeWelcomeModal, setActiveTab } = useAppStore();

  const handlePeriodSelect = () => {
    closeWelcomeModal();
    setActiveTab('goals');
  };

  return (
    <AnimatePresence>
      {showWelcomeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="card-dark w-full max-w-md p-6 relative"
          >
            <button
              onClick={closeWelcomeModal}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto mb-4 animate-float">
                <DracoIcon level={1} />
              </div>
              <h2 className="text-2xl font-bold text-gradient-primary mb-2">
                Bem-vindo ao Draco Habits!
              </h2>
              <p className="text-muted-foreground text-sm">
                Este é o Draco, seu companheiro de jornada. Quanto mais hábitos você completar, mais ele evolui!
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg gradient-fire flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Defina suas metas</h3>
                  <p className="text-xs text-muted-foreground">
                    Organize objetivos por semana, mês, trimestre ou ano
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg gradient-purple flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Acompanhe diariamente</h3>
                  <p className="text-xs text-muted-foreground">
                    Marque seus hábitos todos os dias e veja seu progresso
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-success flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-success-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Ganhe XP e evolua</h3>
                  <p className="text-xs text-muted-foreground">
                    Complete hábitos para ganhar XP e evoluir o Draco
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-center text-sm text-muted-foreground mb-4">
                Comece configurando suas metas:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handlePeriodSelect}
                  className="btn-ghost text-sm py-2"
                >
                  Ano
                </button>
                <button
                  onClick={handlePeriodSelect}
                  className="btn-ghost text-sm py-2"
                >
                  Trimestre
                </button>
                <button
                  onClick={handlePeriodSelect}
                  className="btn-ghost text-sm py-2"
                >
                  Mês
                </button>
              </div>
            </div>

            <button
              onClick={closeWelcomeModal}
              className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Explorar primeiro
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
