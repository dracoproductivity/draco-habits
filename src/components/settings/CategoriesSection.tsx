import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, Edit3, Trash2, Check, X, Save } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_CATEGORIES, CustomCategory, GoalCategory } from '@/types';
import { EmojiPickerButton } from '@/components/ui/EmojiPickerButton';
import { toast } from '@/hooks/use-toast';

// Default categories that can be customized
const EDITABLE_DEFAULT_CATEGORIES = DEFAULT_CATEGORIES.map(cat => ({
  ...cat,
  isDefault: true,
}));

export const CategoriesSection = () => {
  const { customCategories, addCustomCategory, updateCustomCategory, removeCustomCategory } = useAppStore();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDefaultId, setEditingDefaultId] = useState<GoalCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('🏷️');
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  
  // Merge default categories with any custom overrides
  const defaultCategoriesWithOverrides = useMemo(() => {
    return EDITABLE_DEFAULT_CATEGORIES.map(defaultCat => {
      // Check if there's a custom category that overrides this default
      const override = customCategories.find(c => c.id === `default_${defaultCat.id}`);
      if (override) {
        return {
          ...defaultCat,
          name: override.name,
          emoji: override.emoji || '',
          overrideId: override.id,
        };
      }
      return defaultCat;
    });
  }, [customCategories]);
  
  // Filter out custom categories that are overrides of defaults
  const pureCustomCategories = useMemo(() => {
    return customCategories.filter(c => !c.id.startsWith('default_'));
  }, [customCategories]);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite um nome para a categoria',
        variant: 'destructive',
      });
      return;
    }

    addCustomCategory({
      name: newCategoryName.trim(),
      emoji: newCategoryEmoji || undefined,
      xpReward: 10,
    });

    setNewCategoryName('');
    setNewCategoryEmoji('🏷️');
    setIsAdding(false);
    
    toast({
      title: 'Categoria criada!',
      description: `"${newCategoryName}" foi adicionada`,
    });
  };

  const handleStartEdit = (category: CustomCategory) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditEmoji(category.emoji || '');
  };

  const handleStartEditDefault = (cat: typeof EDITABLE_DEFAULT_CATEGORIES[0] & { overrideId?: string }) => {
    setEditingDefaultId(cat.id);
    setEditName(cat.name);
    setEditEmoji(cat.emoji);
  };

  const handleSaveEditDefault = (defaultCatId: GoalCategory, originalCat: typeof EDITABLE_DEFAULT_CATEGORIES[0]) => {
    if (!editName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite um nome para a categoria',
        variant: 'destructive',
      });
      return;
    }

    const overrideId = `default_${defaultCatId}`;
    const existingOverride = customCategories.find(c => c.id === overrideId);
    
    if (existingOverride) {
      updateCustomCategory(overrideId, {
        name: editName.trim(),
        emoji: editEmoji || undefined,
      });
    } else {
      // Create a new custom category as an override
      addCustomCategory({
        name: editName.trim(),
        emoji: editEmoji || undefined,
        xpReward: 10,
      }, overrideId); // Pass custom ID
    }

    setEditingDefaultId(null);
    toast({
      title: 'Categoria atualizada!',
    });
  };

  const handleResetDefault = (defaultCatId: GoalCategory) => {
    const overrideId = `default_${defaultCatId}`;
    removeCustomCategory(overrideId);
    setEditingDefaultId(null);
    toast({
      title: 'Categoria restaurada',
      description: 'A categoria foi restaurada ao padrão',
    });
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite um nome para a categoria',
        variant: 'destructive',
      });
      return;
    }

    updateCustomCategory(id, {
      name: editName.trim(),
      emoji: editEmoji || undefined,
    });

    setEditingId(null);
    toast({
      title: 'Categoria atualizada!',
    });
  };

  const handleDelete = (id: string, name: string) => {
    removeCustomCategory(id);
    toast({
      title: 'Categoria removida',
      description: `"${name}" foi excluída`,
    });
  };

  return (
    <section className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Tag className="w-5 h-5 text-primary-foreground" />
          </div>
          <h2 className="font-semibold text-foreground">Categorias</h2>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Default Categories - Now Editable */}
        <div className="text-xs text-muted-foreground mb-2">Categorias padrão</div>
        {defaultCategoriesWithOverrides.map((cat) => {
          const originalCat = EDITABLE_DEFAULT_CATEGORIES.find(c => c.id === cat.id)!;
          const hasOverride = 'overrideId' in cat;
          
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30"
            >
              {editingDefaultId === cat.id ? (
                <>
                  <EmojiPickerButton
                    value={editEmoji}
                    onChange={setEditEmoji}
                    placeholder={originalCat.emoji}
                    className="w-10 p-2 text-lg"
                  />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 rounded-lg bg-background/50 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Nome da categoria"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEditDefault(cat.id, originalCat)}
                    className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingDefaultId(null)}
                    className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xl">{cat.emoji || originalCat.emoji}</span>
                  <span className="flex-1 font-medium text-foreground">{cat.name}</span>
                  <div className="flex items-center gap-1">
                    {hasOverride && (
                      <button
                        onClick={() => handleResetDefault(cat.id)}
                        className="px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        title="Restaurar padrão"
                      >
                        Restaurar
                      </button>
                    )}
                    <button
                      onClick={() => handleStartEditDefault(cat)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          );
        })}

        {/* Custom Categories */}
        {pureCustomCategories.length > 0 && (
          <div className="text-xs text-muted-foreground mt-4 mb-2">Suas categorias</div>
        )}
        
        <AnimatePresence>
          {pureCustomCategories.map((cat) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30"
            >
              {editingId === cat.id ? (
                <>
                  <EmojiPickerButton
                    value={editEmoji}
                    onChange={setEditEmoji}
                    placeholder="🏷️"
                    className="w-10 p-2 text-lg"
                  />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 rounded-lg bg-background/50 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Nome da categoria"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(cat.id)}
                    className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  {cat.emoji ? (
                    <span className="text-xl">{cat.emoji}</span>
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center text-xs text-muted-foreground">
                      -
                    </span>
                  )}
                  <span className="flex-1 font-medium text-foreground">{cat.name}</span>
                  <button
                    onClick={() => handleStartEdit(cat)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add New Category Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl bg-primary/5 border border-primary/20"
            >
              <div className="flex items-center gap-3 mb-3">
                <EmojiPickerButton
                  value={newCategoryEmoji}
                  onChange={setNewCategoryEmoji}
                  placeholder="🏷️"
                  className="w-10 p-2 text-lg"
                />
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-background/50 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Nome da categoria"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewCategoryName('');
                    setNewCategoryEmoji('🏷️');
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddCategory}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Criar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};