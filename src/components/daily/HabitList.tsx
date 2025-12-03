import { motion } from 'framer-motion';
import { Check, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export const HabitList = () => {
  const { habits, toggleHabitCheck, getHabitCheckForDate, addHabit, removeHabit, settings } = useAppStore();
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleToggle = (habitId: string) => {
    toggleHabitCheck(habitId, today);
  };

  const handleAddHabit = () => {
    if (!newHabitName.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite um nome para o hábito',
        variant: 'destructive',
      });
      return;
    }

    addHabit({
      name: newHabitName.trim(),
      emoji: newHabitEmoji || undefined,
      xpReward: 20,
    });

    setNewHabitName('');
    setNewHabitEmoji('');
    setShowAddHabit(false);
    toast({
      title: 'Hábito adicionado!',
      description: `"${newHabitName}" foi adicionado à sua lista`,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Hábitos do dia</h3>
        <button
          onClick={() => setShowAddHabit(!showAddHabit)}
          className="text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {showAddHabit && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="card-dark p-3 space-y-3"
        >
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Emoji (opcional)"
              value={newHabitEmoji}
              onChange={(e) => setNewHabitEmoji(e.target.value)}
              className="input-dark w-16 text-center"
              maxLength={2}
            />
            <input
              type="text"
              placeholder="Nome do hábito"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              className="input-dark flex-1"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddHabit(false)}
              className="btn-ghost flex-1 py-2 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddHabit}
              className="btn-fire flex-1 py-2 text-sm"
            >
              Adicionar
            </button>
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        {habits.map((habit, index) => {
          const check = getHabitCheckForDate(habit.id, today);
          const isCompleted = check?.completed;

          return (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'card-dark p-3 flex items-center gap-3 transition-all duration-300 group',
                isCompleted && 'border-success/30 glow-success'
              )}
            >
              <button
                onClick={() => handleToggle(habit.id)}
                className={cn(
                  'w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-300',
                  isCompleted
                    ? 'bg-success border-success'
                    : 'border-border hover:border-primary'
                )}
              >
                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  >
                    <Check className="w-5 h-5 text-success-foreground" />
                  </motion.div>
                )}
              </button>

              <div className="flex-1 flex items-center gap-2">
                {settings.showEmojis && habit.emoji && (
                  <span className="text-xl">{habit.emoji}</span>
                )}
                <span
                  className={cn(
                    'font-medium transition-all duration-300',
                    isCompleted && 'text-muted-foreground line-through'
                  )}
                >
                  {habit.name}
                </span>
              </div>

              <span className="text-xs text-muted-foreground">
                +{habit.xpReward} XP
              </span>

              <button
                onClick={() => removeHabit(habit.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}

        {habits.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum hábito cadastrado</p>
            <p className="text-sm">Clique no + para adicionar</p>
          </div>
        )}
      </div>
    </div>
  );
};
