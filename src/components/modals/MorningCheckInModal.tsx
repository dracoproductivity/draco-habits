import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Smartphone, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MorningCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MorningCheckInModal = ({ isOpen, onClose }: MorningCheckInModalProps) => {
  const { user, addDailyLog, updateSettings } = useAppStore();
  const [sleepH, setSleepH] = useState<string>('7');
  const [sleepM, setSleepM] = useState<string>('0');
  const [phoneH, setPhoneH] = useState<string>('2');
  const [phoneM, setPhoneM] = useState<string>('0');

  const firstName = user?.firstName || 'usuário';
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const handleSubmit = () => {
    const sleep = (parseInt(sleepH || '0')) + (parseInt(sleepM || '0')) / 60;
    const phone = (parseInt(phoneH || '0')) + (parseInt(phoneM || '0')) / 60;

    addDailyLog({
      date: yesterday,
      sleepHours: sleep,
      phoneUsageHours: phone,
    });
    updateSettings({ lastDailyLogDate: today });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border border-border/50 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Sun className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Bom dia, {firstName}!</h2>
                  <p className="text-sm text-muted-foreground">Como foi ontem?</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Sleep Input */}
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Moon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Quantas horas você dormiu?</p>
                    <p className="text-xs text-muted-foreground">Na noite passada</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={sleepH}
                      onChange={(e) => setSleepH(e.target.value)}
                      placeholder="0"
                      className="w-16 bg-muted/30 border border-border rounded-xl px-3 py-3 text-foreground text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                    />
                    <span className="text-muted-foreground font-medium text-sm">h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={sleepM}
                      onChange={(e) => setSleepM(e.target.value)}
                      placeholder="0"
                      className="w-16 bg-muted/30 border border-border rounded-xl px-3 py-3 text-foreground text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                    />
                    <span className="text-muted-foreground font-medium text-sm">min</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Tempo de celular inútil ontem?</p>
                    <p className="text-xs text-muted-foreground">Excluindo trabalho/estudo</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={phoneH}
                      onChange={(e) => setPhoneH(e.target.value)}
                      placeholder="0"
                      className="w-16 bg-muted/30 border border-border rounded-xl px-3 py-3 text-foreground text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                    />
                    <span className="text-muted-foreground font-medium text-sm">h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={phoneM}
                      onChange={(e) => setPhoneM(e.target.value)}
                      placeholder="0"
                      className="w-16 bg-muted/30 border border-border rounded-xl px-3 py-3 text-foreground text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                    />
                    <span className="text-muted-foreground font-medium text-sm">min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="w-full mt-6 px-4 py-3 gradient-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Registrar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
