import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Smartphone, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { format, subDays, addDays, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppStore } from '@/store/useAppStore';
import { useCloudSync } from '@/hooks/useCloudSync';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface HealthLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'sleep' | 'phone';
  initialDate?: string;
}

export const HealthLogModal = ({ isOpen, onClose, type, initialDate }: HealthLogModalProps) => {
  const { dailyLogs, addDailyLog } = useAppStore();
  const { saveDailyLog } = useCloudSync();
  
  const today = startOfDay(new Date());
  const thirtyDaysAgo = subDays(today, 30);
  
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDate ? new Date(initialDate) : today
  );
  
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const existingLog = dailyLogs.find(l => l.date === dateStr);
  
  const existingValue = type === 'sleep' 
    ? existingLog?.sleepHours 
    : existingLog?.phoneUsageHours;
  
  const [inputHours, setInputHours] = useState<string>(
    existingValue !== undefined ? Math.floor(existingValue).toString() : ''
  );
  const [inputMinutes, setInputMinutes] = useState<string>(
    existingValue !== undefined ? Math.round((existingValue - Math.floor(existingValue)) * 60).toString() : ''
  );
  
  const [saving, setSaving] = useState(false);

  // Update input when date changes
  useMemo(() => {
    const log = dailyLogs.find(l => l.date === dateStr);
    if (log) {
      const val = type === 'sleep' ? log.sleepHours : log.phoneUsageHours;
      setInputHours(Math.floor(val).toString());
      setInputMinutes(Math.round((val - Math.floor(val)) * 60).toString());
    } else {
      setInputHours('');
      setInputMinutes('');
    }
  }, [dateStr, dailyLogs, type]);

  const canGoNext = !isAfter(addDays(selectedDate, 1), today);
  const canGoPrev = !isAfter(thirtyDaysAgo, selectedDate);

  const handlePrevDay = () => {
    if (canGoPrev) {
      setSelectedDate(subDays(selectedDate, 1));
    }
  };

  const handleNextDay = () => {
    if (canGoNext) {
      setSelectedDate(addDays(selectedDate, 1));
    }
  };

  const handleSave = async () => {
    const h = parseInt(inputHours || '0');
    const m = parseInt(inputMinutes || '0');
    
    if (isNaN(h) || h < 0 || h > 24 || isNaN(m) || m < 0 || m > 59) {
      toast({
        title: 'Valor inválido',
        description: 'Por favor, insira valores válidos de horas (0-24) e minutos (0-59)',
        variant: 'destructive',
      });
      return;
    }

    const numHours = h + m / 60;
    if (numHours > 24) {
      toast({
        title: 'Valor inválido',
        description: 'O total não pode exceder 24 horas',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    
    const logData = {
      date: dateStr,
      sleepHours: type === 'sleep' ? numHours : (existingLog?.sleepHours || 0),
      phoneUsageHours: type === 'phone' ? numHours : (existingLog?.phoneUsageHours || 0),
    };

    // addDailyLog handles both insert and update
    addDailyLog(logData);
    
    await saveDailyLog(logData);
    
    setSaving(false);
    toast({
      title: 'Registro salvo!',
      description: `${type === 'sleep' ? 'Horas de sono' : 'Uso de celular'} registrado para ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`,
    });
    onClose();
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  type === 'sleep' ? 'bg-indigo-500/20' : 'bg-orange-500/20'
                )}>
                  {type === 'sleep' ? (
                    <Moon className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <Smartphone className="w-5 h-5 text-orange-400" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">
                    {type === 'sleep' ? 'Horas de Sono' : 'Celular (inútil)'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Registrar ou alterar
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Date Navigation */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrevDay}
                  disabled={!canGoPrev}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    canGoPrev ? 'hover:bg-muted/50 text-foreground' : 'text-muted-foreground/30 cursor-not-allowed'
                  )}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="text-center">
                  <p className="font-medium text-foreground">
                    {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  {isToday && (
                    <span className="text-xs text-primary font-medium">Hoje</span>
                  )}
                  {existingLog && (
                    <span className="text-xs text-success ml-2">
                      <Check className="w-3 h-3 inline mr-1" />
                      Já registrado
                    </span>
                  )}
                </div>
                
                <button
                  onClick={handleNextDay}
                  disabled={!canGoNext}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    canGoNext ? 'hover:bg-muted/50 text-foreground' : 'text-muted-foreground/30 cursor-not-allowed'
                  )}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Input */}
            <div className="p-6">
              <label className="block text-sm text-muted-foreground mb-2">
                {type === 'sleep' 
                  ? 'Quantas horas você dormiu?' 
                  : 'Quantas horas de celular inútil?'}
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={inputHours}
                    onChange={(e) => setInputHours(e.target.value)}
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
                    value={inputMinutes}
                    onChange={(e) => setInputMinutes(e.target.value)}
                    placeholder="0"
                    className="w-16 bg-muted/30 border border-border rounded-xl px-3 py-3 text-foreground text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                  />
                  <span className="text-muted-foreground font-medium text-sm">min</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-border flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-muted/30 text-foreground font-medium hover:bg-muted/50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || (!inputHours && !inputMinutes)}
                className={cn(
                  'flex-1 py-3 rounded-xl font-medium transition-all',
                  (inputHours || inputMinutes)
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                    : 'bg-muted/30 text-muted-foreground cursor-not-allowed'
                )}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
