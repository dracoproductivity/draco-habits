import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export const HabitList = () => {
  const { habits, settings, addHabit, removeHabit, toggleHabitCheck, getHabitCheckForDate } = useAppStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('');

  const today = new Date().toISOString().split('T')[0];

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
    setShowAddForm(false);
    toast({
      title: 'Hábito adicionado!',
      description: `"${newHabitName}" foi adicionado à sua lista`,
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground text-lg">Hábitos do dia</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex gap-2"
          >
            <input
              type="text"
              placeholder="Emoji"
              value={newHabitEmoji}
              onChange={(e) => setNewHabitEmoji(e.target.value)}
              className="w-14 bg-muted/50 border border-border/50 rounded-xl px-3 py-2 text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              maxLength={2}
            />
            <input
              type="text"
              placeholder="Nome do hábito"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
            />
            <button
              onClick={handleAddHabit}
              className="px-4 py-2 gradient-primary text-primary-foreground rounded-xl font-medium text-sm"
            >
              Adicionar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {habits.map((habit, index) => {
          const check = getHabitCheckForDate(habit.id, today);
          const isCompleted = check?.completed ?? false;

          return (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl transition-all group',
                isCompleted ? 'bg-primary/10' : 'bg-muted/30 hover:bg-muted/50'
              )}
            >
              <button
                onClick={() => toggleHabitCheck(habit.id, today)}
                className={cn(
                  'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
                  isCompleted 
                    ? 'bg-primary border-primary' 
                    : 'border-muted-foreground/50 hover:border-primary'
                )}
              >
                {isCompleted && <Check className="w-4 h-4 text-primary-foreground" />}
              </button>

              <div className="flex-1 flex items-center gap-2">
                {settings.showEmojis && habit.emoji && (
                  <span className="text-lg">{habit.emoji}</span>
                )}
                <span className={cn(
                  'font-medium transition-all',
                  isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                )}>
                  {habit.name}
                </span>
              </div>

              <span className="text-xs text-muted-foreground">+{habit.xpReward} XP</span>

              <button
                onClick={() => removeHabit(habit.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
              >
                <X className="w-4 h-4" />
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
    </motion.div>
  );
};
