import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DracoIcon } from '@/components/icons/DracoIcon';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  dracoName: string;
}

export const LevelUpModal = ({ isOpen, onClose, newLevel, dracoName }: LevelUpModalProps) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Auto close after 4 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md"
        onClick={onClose}
      >
        {/* Confetti particles */}
        {showConfetti && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 1,
                  x: '50vw',
                  y: '50vh',
                  scale: 0,
                }}
                animate={{
                  opacity: [1, 1, 0],
                  x: `${Math.random() * 100}vw`,
                  y: `${Math.random() * 100}vh`,
                  scale: [0, 1, 0.5],
                  rotate: Math.random() * 720,
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  ease: 'easeOut',
                  delay: Math.random() * 0.5,
                }}
                className="absolute w-3 h-3"
                style={{
                  background: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#F97316'][Math.floor(Math.random() * 5)],
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                }}
              />
            ))}
          </div>
        )}

        {/* Main modal */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          className="relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow effect */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary via-secondary to-primary blur-3xl"
          />

          <div className="relative bg-card border-2 border-primary/50 rounded-3xl p-8 text-center shadow-2xl overflow-hidden">
            {/* Sparkle decorations */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-10 -right-10 text-primary/20"
            >
              <Sparkles className="w-32 h-32" />
            </motion.div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute -bottom-10 -left-10 text-secondary/20"
            >
              <Star className="w-28 h-28" />
            </motion.div>

            {/* Draco Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', damping: 10 }}
              className="relative mx-auto mb-4 w-28 h-28"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-full h-full"
              >
                <DracoIcon level={newLevel} />
              </motion.div>
              
              {/* Orbiting stars */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0"
              >
                <Star className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 text-yellow-400 fill-yellow-400" />
              </motion.div>
            </motion.div>

            {/* Level up text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.p
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                className="text-primary font-bold text-lg uppercase tracking-widest mb-2"
              >
                Level Up!
              </motion.p>
              
              <h2 className="text-4xl font-bold text-foreground mb-2">
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                >
                  Nível {newLevel}
                </motion.span>
              </h2>
              
              <p className="text-muted-foreground">
                <span className="text-foreground font-medium">{dracoName}</span> evoluiu!
              </p>
            </motion.div>

            {/* Motivational message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-4 text-sm text-muted-foreground"
            >
              Continue assim! 🔥
            </motion.p>

            {/* Progress bars decoration */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mt-6 h-2 bg-gradient-to-r from-primary via-secondary to-primary rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
