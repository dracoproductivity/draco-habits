import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const { settings } = useAppStore();
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const PICKER_WIDTH = 300;
  const PICKER_HEIGHT = 400;
  const GAP = 8;
  const VIEWPORT_PADDING = 8;

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onChange(emojiData.emoji);
    setShowPicker(false);
  };

  // Close picker when clicking outside
  useEffect(() => {
    if (!showPicker) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      // Clicked the toggle button/container
      if (containerRef.current?.contains(target)) return;
      // Clicked inside the picker portal
      if (pickerRef.current?.contains(target)) return;

      setShowPicker(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showPicker]);

  // Position picker (portal) relative to button
  useEffect(() => {
    if (!showPicker) return;
    if (typeof window === 'undefined') return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      // default: open below
      let top = rect.bottom + GAP;
      const openAbove = top + PICKER_HEIGHT + VIEWPORT_PADDING > window.innerHeight &&
        rect.top - GAP - PICKER_HEIGHT - VIEWPORT_PADDING >= 0;

      if (openAbove) {
        top = rect.top - GAP - PICKER_HEIGHT;
      }

      let left = rect.left;

      // clamp horizontally
      const maxLeft = window.innerWidth - VIEWPORT_PADDING - PICKER_WIDTH;
      left = Math.min(left, maxLeft);
      left = Math.max(left, VIEWPORT_PADDING);

      setPickerPos({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    // capture scroll from any scroll container
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showPicker]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className={cn(
          'w-14 p-3 rounded-xl bg-muted/30 border border-border/50 focus:outline-none focus:border-primary text-center text-xl transition-all hover:bg-muted/50',
          className
        )}
      >
        {value || placeholder}
      </button>

      {showPicker &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={pickerRef}
            className="fixed z-[2147483647]"
            style={{ top: pickerPos.top, left: pickerPos.left, width: PICKER_WIDTH }}
          >
            <div className="rounded-xl overflow-hidden border border-border bg-popover shadow-2xl">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={settings.darkMode ? Theme.DARK : Theme.LIGHT}
                width={PICKER_WIDTH}
                height={PICKER_HEIGHT}
                searchPlaceholder="Buscar emoji..."
                previewConfig={{ showPreview: false }}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
