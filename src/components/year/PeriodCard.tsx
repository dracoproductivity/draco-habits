import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, ChevronUp, X, Image } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { GoalType } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface PeriodCardProps {
  title: string;
  type: GoalType;
  period: string;
  wallpaper?: string;
  className?: string;
}

const defaultWallpapers = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=400&h=200&fit=crop',
];

export const PeriodCard = ({ title, type, period, className }: PeriodCardProps) => {
  const { goals, addGoal, updateGoal, removeGoal, settings } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalEmoji, setNewGoalEmoji] = useState('');
  const [selectedWallpaper, setSelectedWallpaper] = useState(defaultWallpapers[0]);

  const periodGoals = goals.filter((g) => g.type === type && g.period === period);
  const averageProgress = periodGoals.length > 0
    ? Math.round(periodGoals.reduce((acc, g) => acc + g.progress, 0) / periodGoals.length)
    : 0;

  const handleAddGoal = () => {
    if (!newGoalName.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite um nome para o objetivo',
        variant: 'destructive',
      });
      return;
    }

    addGoal({
      name: newGoalName.trim(),
      emoji: newGoalEmoji || undefined,
      type,
      period,
      progress: 0,
      wallpaper: selectedWallpaper,
    });

    setNewGoalName('');
    setNewGoalEmoji('');
    setShowAddGoal(false);
    toast({
      title: 'Objetivo adicionado!',
      description: `"${newGoalName}" foi adicionado`,
    });
  };

  const handleProgressChange = (goalId: string, newProgress: number) => {
    updateGoal(goalId, { progress: Math.min(100, Math.max(0, newProgress)) });
  };

  return (
    <motion.div
      layout
      className={cn(
        'card-dark overflow-hidden relative group',
        className
      )}
    >
      {/* Wallpaper background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${selectedWallpaper})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />

      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{period}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gradient-fire">{averageProgress}%</span>
            <button
              onClick={() => setShowWallpaperPicker(!showWallpaperPicker)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
            >
              <Image className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-bar mb-3">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${averageProgress}%` }}
          />
        </div>

        {/* Wallpaper picker */}
        <AnimatePresence>
          {showWallpaperPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 grid grid-cols-4 gap-2"
            >
              {defaultWallpapers.map((wp, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedWallpaper(wp);
                    setShowWallpaperPicker(false);
                  }}
                  className={cn(
                    'aspect-video rounded-lg overflow-hidden border-2 transition-all',
                    selectedWallpaper === wp ? 'border-primary' : 'border-transparent'
                  )}
                >
                  <img src={wp} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {/* Goals list */}
              {periodGoals.map((goal) => (
                <div key={goal.id} className="bg-muted/50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {settings.showEmojis && goal.emoji && (
                        <span>{goal.emoji}</span>
                      )}
                      <span className="font-medium text-sm">{goal.name}</span>
                    </div>
                    <button
                      onClick={() => removeGoal(goal.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={goal.progress}
                      onChange={(e) => handleProgressChange(goal.id, parseInt(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-sm font-medium w-12 text-right">{goal.progress}%</span>
                  </div>
                </div>
              ))}

              {periodGoals.length === 0 && !showAddGoal && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Nenhum objetivo definido
                </p>
              )}

              {/* Add goal form */}
              {showAddGoal ? (
                <div className="bg-muted/50 rounded-xl p-3 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="🎯"
                      value={newGoalEmoji}
                      onChange={(e) => setNewGoalEmoji(e.target.value)}
                      className="input-dark w-12 text-center"
                      maxLength={2}
                    />
                    <input
                      type="text"
                      placeholder="Nome do objetivo"
                      value={newGoalName}
                      onChange={(e) => setNewGoalName(e.target.value)}
                      className="input-dark flex-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddGoal(false)}
                      className="btn-ghost flex-1 py-2 text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddGoal}
                      className="btn-fire flex-1 py-2 text-sm"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddGoal(true)}
                  className="w-full py-2 border border-dashed border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-primary transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar objetivo
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed summary */}
        {!isExpanded && periodGoals.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {periodGoals.length} objetivo{periodGoals.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </motion.div>
  );
};
