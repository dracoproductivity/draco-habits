import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FireCelebrationProps {
  isActive: boolean;
  onComplete?: () => void;
}

const FireParticle = ({ delay, side }: { delay: number; side: 'left' | 'right' | 'center' }) => {
  const xPosition = side === 'left' ? '10%' : side === 'right' ? '90%' : '50%';
  const xOffset = side === 'left' ? -30 : side === 'right' ? 30 : 0;
  
  return (
    <motion.div
      initial={{ 
        y: '100vh', 
        x: xOffset,
        opacity: 0,
        scale: 0.5
      }}
      animate={{ 
        y: [null, '-20vh', '100vh'],
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.2, 0.8]
      }}
      transition={{
        duration: 3,
        delay,
        ease: 'easeOut',
        times: [0, 0.3, 1]
      }}
      style={{ left: xPosition }}
      className="absolute bottom-0 pointer-events-none"
    >
      <div className="relative">
        {/* Main flame */}
        <motion.div
          animate={{
            scaleY: [1, 1.2, 0.9, 1.1, 1],
            scaleX: [1, 0.9, 1.1, 0.95, 1],
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="w-8 h-16 rounded-full"
          style={{
            background: 'linear-gradient(to top, hsl(var(--primary)), hsl(25, 95%, 53%), hsl(45, 100%, 51%))',
            filter: 'blur(2px)',
            boxShadow: '0 0 30px hsl(var(--primary) / 0.8), 0 0 60px hsl(25, 95%, 53% / 0.5)'
          }}
        />
        {/* Inner glow */}
        <motion.div
          animate={{
            opacity: [0.7, 1, 0.8, 1, 0.7],
          }}
          transition={{
            duration: 0.2,
            repeat: Infinity,
          }}
          className="absolute inset-2 rounded-full"
          style={{
            background: 'linear-gradient(to top, hsl(45, 100%, 70%), hsl(60, 100%, 80%))',
            filter: 'blur(3px)'
          }}
        />
      </div>
    </motion.div>
  );
};

const FlameColumn = ({ x, delay }: { x: string; delay: number }) => {
  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ 
        y: ['100%', '-10%', '100%'],
        opacity: [0, 1, 1, 0]
      }}
      transition={{
        duration: 2.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      style={{ left: x }}
      className="absolute bottom-0 w-16 h-full pointer-events-none"
    >
      <motion.div
        animate={{
          scaleY: [1, 1.1, 0.95, 1.05, 1],
          scaleX: [1, 0.95, 1.05, 0.98, 1],
        }}
        transition={{
          duration: 0.15,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="w-full h-48 rounded-t-full origin-bottom"
        style={{
          background: 'linear-gradient(to top, hsl(var(--primary)) 0%, hsl(25, 95%, 53%) 40%, hsl(45, 100%, 51%) 70%, hsl(60, 100%, 70%) 100%)',
          filter: 'blur(8px)',
          boxShadow: '0 0 60px hsl(var(--primary) / 0.6), 0 0 100px hsl(25, 95%, 53% / 0.4)'
        }}
      />
    </motion.div>
  );
};

export const FireCelebration = ({ isActive, onComplete }: FireCelebrationProps) => {
  const [particles, setParticles] = useState<Array<{ id: number; delay: number; side: 'left' | 'right' | 'center' }>>([]);
  const [flames, setFlames] = useState<Array<{ id: number; x: string; delay: number }>>([]);

  useEffect(() => {
    if (isActive) {
      // Create fire particles
      const newParticles = [];
      const sides: ('left' | 'right' | 'center')[] = ['left', 'right', 'center'];
      
      for (let i = 0; i < 15; i++) {
        newParticles.push({
          id: i,
          delay: Math.random() * 0.5,
          side: sides[i % 3]
        });
      }
      setParticles(newParticles);

      // Create flame columns
      const newFlames = [];
      const positions = ['5%', '15%', '25%', '35%', '45%', '55%', '65%', '75%', '85%', '95%'];
      
      for (let i = 0; i < positions.length; i++) {
        newFlames.push({
          id: i,
          x: positions[i],
          delay: i * 0.05
        });
      }
      setFlames(newFlames);

      // Cleanup after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setParticles([]);
      setFlames([]);
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
        >
          {/* Background glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0.2, 0.3, 0] }}
            transition={{ duration: 3, ease: 'easeInOut' }}
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at bottom, hsl(var(--primary) / 0.3) 0%, transparent 70%)'
            }}
          />

          {/* Flame columns */}
          {flames.map((flame) => (
            <FlameColumn key={flame.id} x={flame.x} delay={flame.delay} />
          ))}

          {/* Fire particles */}
          {particles.map((particle) => (
            <FireParticle
              key={particle.id}
              delay={particle.delay}
              side={particle.side}
            />
          ))}

          {/* Celebration text */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.2, 1],
              opacity: [0, 1, 1, 0]
            }}
            transition={{ 
              duration: 2,
              delay: 0.3,
              times: [0, 0.3, 0.7, 1]
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="text-6xl mb-4"
              >
                🔥
              </motion.div>
              <motion.p
                className="text-2xl font-bold text-primary-foreground"
                style={{
                  textShadow: '0 0 20px hsl(var(--primary)), 0 0 40px hsl(25, 95%, 53%)'
                }}
              >
                100% Completo!
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
