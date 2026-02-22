import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Calendar, AlertTriangle } from 'lucide-react';
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [noteCreated, setNoteCreated] = useState(false);

  const handleCreateNote = () => {
    addNote({ title, content, noteDate });
    setNoteCreated(true);
  };

  const handleSave = () => {
    if (!isNew) {
      updateNote(note.id, { title, content, noteDate });
    }
    onClose();
  };

  const handleClose = () => {
    if (!isNew) {
      // Editing existing note - save and close
      handleSave();
    } else if (noteCreated) {
      // Already created - just close
      onClose();
    } else {
      // New note not yet created - show confirmation
      setShowCloseConfirm(true);
    }
  };

  const handleConfirmCreate = () => {
    addNote({ title, content, noteDate });
    setShowCloseConfirm(false);
    onClose();
  };

  const handleConfirmDiscard = () => {
    setShowCloseConfirm(false);
    onClose();
  };

  const handleDelete = () => {
    if (!isNew) {
      removeNote(note.id);
    }
    onClose();
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const formatDisplayDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return format(date, "dd 'de' MMMM, yyyy", { locale: ptBR });
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
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
                onClick={handleDeleteClick}
                className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            )}
            <button
              onClick={handleClose}
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
            className="border-none bg-transparent resize-none min-h-[300px] p-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Create Note Button - only for new notes that haven't been created yet */}
        {isNew && !noteCreated && (
          <div className="px-4 pb-4">
            <button
              onClick={handleCreateNote}
              className="w-full py-3 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold transition-all hover:opacity-90"
            >
              Criar Anotação
            </button>
          </div>
        )}

        {/* Created confirmation */}
        {isNew && noteCreated && (
          <div className="px-4 pb-4">
            <p className="text-xs text-center text-muted-foreground">✓ Anotação criada</p>
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-card border border-border/50 rounded-2xl shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Excluir anotação</h4>
                  <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Tem certeza que deseja excluir esta anotação?</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-muted/30 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close without creating Confirmation Dialog */}
      <AnimatePresence>
        {showCloseConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowCloseConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-card border border-border/50 rounded-2xl shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Criar anotação?</h4>
                  <p className="text-xs text-muted-foreground">Você ainda não salvou esta anotação</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Deseja criar esta anotação antes de fechar?</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleConfirmDiscard}
                  className="flex-1 py-2.5 rounded-xl bg-muted/30 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  Descartar
                </button>
                <button
                  onClick={handleConfirmCreate}
                  className="flex-1 py-2.5 rounded-xl gradient-primary text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
                >
                  Criar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body
  );
};
