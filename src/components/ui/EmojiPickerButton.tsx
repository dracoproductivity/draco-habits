import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

interface EmojiPickerButtonProps {
  value: string;
  onChange: (emoji: string) => void;
  placeholder?: string;
  className?: string;
}

export const EmojiPickerButton: React.FC<EmojiPickerButtonProps> = ({
  value,
  onChange,
  placeholder = '🎯',
  className,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { settings } = useAppStore();

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onChange(emojiData.emoji);
    setShowPicker(false);
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className={cn(
          'w-14 p-3 rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:border-primary text-center text-xl transition-all hover:bg-muted/50',
          className
        )}
      >
        {value || placeholder}
      </button>

      {showPicker && (
        <div className="fixed z-[9999] mt-2" style={{ top: 'auto', left: 'auto' }}>
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={settings.darkMode ? Theme.DARK : Theme.LIGHT}
            width={300}
            height={400}
            searchPlaceholder="Buscar emoji..."
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
};
