import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Smartphone, Sun } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const GREETINGS = [
  'Bom dia! ☀️',
  'Olá! 🌞',
  'Bom dia, campeão! 💪',
  'Acorda que hoje vai ser incrível! 🚀',
  'Bom dia! Pronto para mais um dia? 🌅',
];

export const DailyCheckInModal = () => {
  const { showDailyCheckIn, closeDailyCheckIn, addDailyTracking } = useAppStore();
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [phoneHours, setPhoneHours] = useState<number | null>(null);
  
  const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  
  // Yesterday's date for tracking
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const handleSave = () => {
    if (sleepHours !== null && phoneHours !== null) {
      addDailyTracking({
        date: yesterdayStr,
        sleepHours,
        phoneHours,
      });
      closeDailyCheckIn();
    }
  };

  const handleSkip = () => {
    closeDailyCheckIn();
  };

  const sleepOptions = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const phoneOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <AnimatePresence>
      {showDailyCheckIn && (
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
            className="w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 pb-4 text-center relative">
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
              
              <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center">
                <Sun className="w-8 h-8 text-primary-foreground" />
              </div>
              
              <h2 className="text-2xl font-bold text-foreground">{greeting}</h2>
              <p className="text-muted-foreground mt-1">
                Como foi o dia de ontem?
              </p>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 space-y-6">
              {/* Sleep Hours */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Moon className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Quantas horas você dormiu na noite passada?</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sleepOptions.map((hours) => (
                    <button
                      key={hours}
                      onClick={() => setSleepHours(hours)}
                      className={cn(
                        'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                        sleepHours === hours
                          ? 'gradient-primary text-primary-foreground'
                          : 'bg-muted/30 text-foreground hover:bg-muted/50 border border-border/50'
                      )}
                    >
                      {hours}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Hours */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Quanto tempo de celular inútil ontem?</span>
                </div>
                <p className="text-xs text-muted-foreground -mt-1">
                  (Não inclui tempo de trabalho/produtivo)
                </p>
                <div className="flex flex-wrap gap-2">
                  {phoneOptions.map((hours) => (
                    <button
                      key={hours}
                      onClick={() => setPhoneHours(hours)}
                      className={cn(
                        'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                        phoneHours === hours
                          ? 'gradient-primary text-primary-foreground'
                          : 'bg-muted/30 text-foreground hover:bg-muted/50 border border-border/50'
                      )}
                    >
                      {hours}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSkip}
                  className="flex-1 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/30 transition-colors font-medium"
                >
                  Pular
                </button>
                <button
                  onClick={handleSave}
                  disabled={sleepHours === null || phoneHours === null}
                  className={cn(
                    'flex-1 px-4 py-3 rounded-xl font-medium transition-all',
                    sleepHours !== null && phoneHours !== null
                      ? 'gradient-primary text-primary-foreground'
                      : 'bg-muted/30 text-muted-foreground cursor-not-allowed'
                  )}
                >
                  Salvar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
