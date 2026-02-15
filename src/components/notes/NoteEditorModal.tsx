import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Trash2, Calendar } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Note } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NoteEditorModalProps {
  note: Note;
  isNew: boolean;
  onClose: () => void;
}

export const NoteEditorModal = ({ note, isNew, onClose }: NoteEditorModalProps) => {
  const { addNote, updateNote, removeNote } = useAppStore();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [noteDate, setNoteDate] = useState(note.noteDate);

  const formatDisplayDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return format(date, "dd 'de' MMMM, yyyy", { locale: ptBR });
  };

  const handleSave = () => {
    if (isNew) {
      addNote({ title, content, noteDate });
    } else {
      updateNote(note.id, { title, content, noteDate });
    }
    onClose();
  };

  const handleDelete = () => {
    if (!isNew) {
      removeNote(note.id);
    }
    onClose();
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleSave(); }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-card border border-border/50 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Color bar */}
        <div className="h-1.5 w-full gradient-primary rounded-t-2xl" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={noteDate}
              onChange={(e) => setNoteDate(e.target.value)}
              className="bg-transparent text-sm text-muted-foreground border-none outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            )}
            <button
              onClick={handleSave}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Date display */}
        <div className="px-4 pt-4">
          <p className="text-xs text-muted-foreground">{formatDisplayDate(noteDate)}</p>
        </div>

        {/* Title */}
        <div className="px-4 pt-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da anotação..."
            className="border-none bg-transparent text-lg font-semibold p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Content */}
        <div className="px-4 pt-2 pb-4 flex-1 overflow-auto">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva aqui..."
            className="border-none bg-transparent resize-none min-h-[200px] p-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
          />
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};
