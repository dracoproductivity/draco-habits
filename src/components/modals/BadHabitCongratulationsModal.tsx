import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Sparkles, Trophy } from 'lucide-react';

interface BadHabitCongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitName: string;
}

export const BadHabitCongratulationsModal = ({ isOpen, onClose, habitName }: BadHabitCongratulationsModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="w-full max-w-sm bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative header */}
          <div className="relative bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 p-6">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Sparkles className="w-32 h-32 text-green-400" />
            </div>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="relative flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-3"
              >
                <Trophy className="w-8 h-8 text-green-500" />
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold text-foreground"
              >
                Parabéns! 🎉
              </motion.h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center space-y-4">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground"
            >
              Você ficou mais um dia longe de{' '}
              <span className="font-semibold text-foreground">"{habitName}"</span>!
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 text-green-500"
            >
              <Heart className="w-5 h-5 fill-green-500" />
              <span className="font-medium">Temos orgulho do seu esforço!</span>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-muted-foreground"
            >
              Continue assim! Cada dia longe desse hábito é uma vitória para sua qualidade de vida.
            </motion.p>
          </div>

          {/* Action button */}
          <div className="px-6 pb-6">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Continuar
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};