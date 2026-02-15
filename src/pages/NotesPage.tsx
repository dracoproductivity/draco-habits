import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { UniversalHeader } from '@/components/layout/UniversalHeader';
import { NoteEditorModal } from '@/components/notes/NoteEditorModal';
import { useAppStore } from '@/store/useAppStore';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { Note } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatLocalDate } from '@/utils/dateUtils';

export const NotesPage = () => {
  const { isDesktop } = useResponsive();
  const { notes } = useAppStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const sortedNotes = [...notes].sort((a, b) => 
    new Date(b.noteDate).getTime() - new Date(a.noteDate).getTime()
  );

  const handleCreateNote = () => {
    setEditingNote({
      id: '',
      title: '',
      content: '',
      noteDate: formatLocalDate(new Date()),
      createdAt: new Date().toISOString(),
    });
    setIsCreating(true);
  };

  const formatNoteDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return format(date, "dd 'de' MMMM, yyyy", { locale: ptBR });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('min-h-screen flex flex-col', isDesktop ? 'pb-24' : 'pb-20')}
    >
      <UniversalHeader />

      <div className={cn(
        'px-4 pt-2 pb-4 flex-1',
        isDesktop && 'max-w-6xl mx-auto w-full'
      )}>
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Anotações</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                viewMode === 'grid'
                  ? 'gradient-primary text-primary-foreground'
                  : 'glass-card hover:border-primary/40'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                viewMode === 'list'
                  ? 'gradient-primary text-primary-foreground'
                  : 'glass-card hover:border-primary/40'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notes */}
        {sortedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-lg mb-2">Nenhuma anotação ainda</p>
            <p className="text-sm">Clique no botão + para criar sua primeira anotação</p>
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid'
              ? cn('grid gap-4', isDesktop ? 'grid-cols-3' : 'grid-cols-2')
              : 'flex flex-col gap-3'
          )}>
            {sortedNotes.map((note) => (
              <motion.button
                key={note.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setEditingNote(note); setIsCreating(false); }}
                className={cn(
                  'glass-card rounded-2xl overflow-hidden text-left transition-all',
                  viewMode === 'grid' ? 'flex flex-col' : 'flex flex-col'
                )}
              >
                {/* Color bar */}
                <div className="h-1.5 w-full gradient-primary" />
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    {formatNoteDate(note.noteDate)}
                  </p>
                  <p className="text-sm font-semibold text-foreground line-clamp-2">
                    {note.title || 'Sem título'}
                  </p>
                  {viewMode === 'list' && note.content && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {note.content}
                    </p>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* FAB */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleCreateNote}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full gradient-primary text-primary-foreground shadow-lg flex items-center justify-center z-40"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {editingNote && (
          <NoteEditorModal
            note={editingNote}
            isNew={isCreating}
            onClose={() => { setEditingNote(null); setIsCreating(false); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
