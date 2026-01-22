import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Check, Repeat, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { EmojiPickerButton } from '@/components/ui/EmojiPickerButton';
import { Goal } from '@/types';
import { toast } from '@/hooks/use-toast';

const WEEK_DAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

interface HabitCreationFormProps {
  parentGoal: Goal;
  onClose: () => void;
  onCreated?: () => void;
}

export const HabitCreationForm = ({ parentGoal, onClose, onCreated }: HabitCreationFormProps) => {
  const { addHabit } = useAppStore();
  
  const [habitName, setHabitName] = useState('');
  const [habitEmoji, setHabitEmoji] = useState('');
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isOneTimeHabit, setIsOneTimeHabit] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<1 | 2 | 3 | 4>(1);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState('08:00');

  const toggleWeekDay = (day: number) => {
    if (selectedWeekDays.includes(day)) {
      setSelectedWeekDays(selectedWeekDays.filter(d => d !== day));
    } else {
      setSelectedWeekDays([...selectedWeekDays, day].sort());
    }
  };

  const handleCreateHabit = () => {
    if (!habitName.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite um nome para o hábito',
        variant: 'destructive',
      });
      return;
    }

    addHabit({
      name: habitName.trim(),
      emoji: habitEmoji || undefined,
      xpReward: parentGoal.categoryXP || 20,
      goalId: parentGoal.id,
      weekDays: isOneTimeHabit ? undefined : selectedWeekDays,
      isOneTime: isOneTimeHabit,
      repeatFrequency: isOneTimeHabit ? undefined : repeatFrequency,
      notificationEnabled,
      notificationTime: notificationEnabled ? notificationTime : undefined,
    });

    toast({
      title: 'Hábito criado!',
      description: `"${habitName}" vinculado a "${parentGoal.name}"`,
    });

    onCreated?.();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Criar Hábito</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 mb-4">
          <p className="text-sm text-muted-foreground">
            Vinculado a: <span className="font-semibold text-foreground">{parentGoal.emoji && `${parentGoal.emoji} `}{parentGoal.name}</span>
          </p>
        </div>

        <div className="space-y-4">
          {/* Name and Emoji */}
          <div className="flex gap-2">
            <EmojiPickerButton
              value={habitEmoji}
              onChange={setHabitEmoji}
              placeholder="😊"
            />
            <input
              type="text"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              placeholder="Nome do hábito"
              className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {/* Repetition Type */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Repetição</span>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOneTimeHabit(false)}
                className={cn(
                  'flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all',
                  !isOneTimeHabit
                    ? 'gradient-primary text-primary-foreground'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                )}
              >
                Repetir
              </button>
              <button
                type="button"
                onClick={() => setIsOneTimeHabit(true)}
                className={cn(
                  'flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all',
                  isOneTimeHabit
                    ? 'gradient-primary text-primary-foreground'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                )}
              >
                Evento único
              </button>
            </div>
          </div>

          {/* Frequency and Days */}
          {!isOneTimeHabit && (
            <>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Frequência:</span>
                <div className="grid grid-cols-4 gap-1">
                  {([1, 2, 3, 4] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setRepeatFrequency(freq)}
                      className={cn(
                        'py-1.5 px-1 rounded-lg text-xs font-medium transition-all',
                        repeatFrequency === freq
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                      )}
                    >
                      {freq === 1 ? 'Toda sem.' : `${freq} sem.`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Dias:</span>
                <div className="flex gap-1">
                  {WEEK_DAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWeekDay(day.value)}
                      className={cn(
                        'flex-1 py-1.5 px-1 rounded-lg text-xs font-medium transition-all',
                        selectedWeekDays.includes(day.value)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Notification */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Lembrete</span>
              </div>
              <button
                onClick={() => setNotificationEnabled(!notificationEnabled)}
                className={cn(
                  'w-10 h-5 rounded-full transition-all relative',
                  notificationEnabled ? 'bg-primary' : 'bg-muted'
                )}
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-all',
                    notificationEnabled ? 'right-0.5' : 'left-0.5'
                  )}
                />
              </button>
            </div>
            
            {notificationEnabled && (
              <input
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
                className="w-full p-2 rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:border-primary text-sm"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-muted/50 text-foreground rounded-xl font-semibold hover:bg-muted/70 transition-colors"
            >
              Pular
            </button>
            <button
              onClick={handleCreateHabit}
              disabled={!habitName.trim()}
              className="flex-1 py-3 gradient-fire text-primary-foreground rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Criar Hábito
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
