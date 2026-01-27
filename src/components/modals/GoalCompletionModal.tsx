import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Trophy, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Goal } from '@/types';
import { formatPercentage } from '@/utils/formatPercentage';

interface GoalCompletionModalProps {
  isOpen: boolean;
  goal: Goal;
  onComplete: (status: 'completed' | 'failed') => void;
  onClose: () => void;
}

export const GoalCompletionModal = ({ isOpen, goal, onComplete, onClose }: GoalCompletionModalProps) => {
  if (!isOpen) return null;

  const handleComplete = (status: 'completed' | 'failed') => {
    onComplete(status);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Período do objetivo encerrado!</h2>
              <p className="text-muted-foreground">
                O período do objetivo <span className="font-semibold text-foreground">{goal.emoji && `${goal.emoji} `}{goal.name}</span> chegou ao fim.
              </p>
              <p className="text-lg font-bold mt-2 text-primary">
                Progresso: {formatPercentage(goal.progress)}
              </p>
            </div>

            {/* Question */}
            <p className="text-center text-lg font-medium mb-6">
              Você conseguiu alcançar seu objetivo?
            </p>

            {/* Options */}
            <div className="space-y-3">
              {/* Success option */}
              <button
                onClick={() => handleComplete('completed')}
                className="w-full p-4 rounded-xl border-2 border-success/30 bg-success/10 hover:bg-success/20 transition-all group flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Check className="w-6 h-6 text-success" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-success">Sim, consegui!</p>
                </div>
              </button>

              {/* Failed option */}
              <button
                onClick={() => handleComplete('failed')}
                className="w-full p-4 rounded-xl border-2 border-destructive/30 bg-destructive/10 hover:bg-destructive/20 transition-all group flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Heart className="w-6 h-6 text-destructive" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-destructive">Infelizmente, não, mas estou orgulhoso do meu desempenho!</p>
                </div>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
