import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface HSLColor {
  h: number;
  s: number;
  l: number;
}

interface ColorWheelPickerProps {
  value: HSLColor;
  onChange: (color: HSLColor) => void;
  className?: string;
}

const getColorName = (h: number, s: number, l: number): string => {
  if (s < 10) {
    if (l > 90) return 'Branco';
    if (l < 15) return 'Preto';
    return 'Cinza';
  }
  
  // Map hue to color names
  if (h >= 345 || h < 15) return 'Vermelho';
  if (h >= 15 && h < 45) return 'Laranja';
  if (h >= 45 && h < 75) return 'Amarelo';
  if (h >= 75 && h < 150) return 'Verde';
  if (h >= 150 && h < 195) return 'Ciano';
  if (h >= 195 && h < 255) return 'Azul';
  if (h >= 255 && h < 285) return 'Roxo';
  if (h >= 285 && h < 330) return 'Lavanda';
  if (h >= 330 && h < 345) return 'Rosa';
  
  return 'Cor';
};

export const ColorWheelPicker = ({ value, onChange, className }: ColorWheelPickerProps) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleWheelInteraction = useCallback((clientX: number, clientY: number) => {
    if (!wheelRef.current) return;
    
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;
    
    // Calculate angle (hue) and distance (saturation)
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    
    const maxRadius = rect.width / 2;
    const distance = Math.min(Math.sqrt(x * x + y * y), maxRadius);
    const saturation = (distance / maxRadius) * 100;
    
    onChange({
      h: Math.round(angle),
      s: Math.round(saturation),
      l: value.l
    });
  }, [onChange, value.l]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleWheelInteraction(e.clientX, e.clientY);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      handleWheelInteraction(e.clientX, e.clientY);
    }
  }, [isDragging, handleWheelInteraction]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    handleWheelInteraction(touch.clientX, touch.clientY);
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging) {
      const touch = e.touches[0];
      handleWheelInteraction(touch.clientX, touch.clientY);
    }
  }, [isDragging, handleWheelInteraction]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  // Calculate indicator position
  const getIndicatorPosition = () => {
    if (!wheelRef.current) return { x: 0, y: 0 };
    
    const radius = 120; // Half of wheel size
    const angle = (value.h - 90) * (Math.PI / 180);
    const distance = (value.s / 100) * radius;
    
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
  };

  const indicatorPos = getIndicatorPosition();
  const colorName = getColorName(value.h, value.s, value.l);

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Color Wheel */}
      <div className="relative">
        <div
          ref={wheelRef}
          className="w-60 h-60 rounded-full cursor-crosshair touch-none relative"
          style={{
            background: `conic-gradient(
              from 0deg,
              hsl(0, 100%, 50%),
              hsl(60, 100%, 50%),
              hsl(120, 100%, 50%),
              hsl(180, 100%, 50%),
              hsl(240, 100%, 50%),
              hsl(300, 100%, 50%),
              hsl(360, 100%, 50%)
            )`,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* White to transparent radial gradient for saturation */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, white 0%, transparent 70%)',
            }}
          />
          
          {/* Indicator */}
          <div
            className="absolute w-5 h-5 rounded-full border-2 border-white shadow-lg pointer-events-none"
            style={{
              left: `calc(50% + ${indicatorPos.x}px - 10px)`,
              top: `calc(50% + ${indicatorPos.y}px - 10px)`,
              backgroundColor: `hsl(${value.h}, ${value.s}%, ${value.l}%)`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          />
        </div>
        
        {/* Color name tooltip */}
        <div 
          className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-foreground shadow-lg border border-border/50"
        >
          {colorName}
        </div>
      </div>

      {/* Lightness Slider */}
      <div className="w-full max-w-60">
        <div 
          className="h-6 rounded-full cursor-pointer relative"
          style={{
            background: `linear-gradient(to right, 
              hsl(${value.h}, ${value.s}%, 10%), 
              hsl(${value.h}, ${value.s}%, 50%), 
              hsl(${value.h}, ${value.s}%, 90%)
            )`,
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const lightness = Math.round((x / rect.width) * 80 + 10); // 10-90 range
            onChange({ ...value, l: Math.max(10, Math.min(90, lightness)) });
          }}
        >
          {/* Slider thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-foreground/80 shadow-lg pointer-events-none"
            style={{
              left: `calc(${((value.l - 10) / 80) * 100}% - 10px)`,
              backgroundColor: `hsl(${value.h}, ${value.s}%, ${value.l}%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
