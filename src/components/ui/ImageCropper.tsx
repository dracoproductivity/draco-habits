import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Move, Check, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ImageCropperProps {
  imageSrc: string;
  aspectRatio?: number; // width/height, e.g., 16/9, 1, 3/4
  onSave: (croppedDataUrl: string) => void;
  onCancel: () => void;
  outputWidth?: number;
  outputHeight?: number;
  className?: string;
  circular?: boolean; // For profile photos
}

export const ImageCropper = ({
  imageSrc,
  aspectRatio = 16 / 9,
  onSave,
  onCancel,
  outputWidth = 1920,
  outputHeight,
  className,
  circular = false,
}: ImageCropperProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const finalOutputHeight = outputHeight || Math.round(outputWidth / aspectRatio);

  // Load image dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      setImageLoaded(true);
      // Reset position and zoom when new image loads
      setPosition({ x: 0, y: 0 });
      setZoom(1);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    setPosition({ x: newX, y: newY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    
    setPosition({ x: newX, y: newY });
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoomChange = (value: number[]) => {
    setZoom(value[0]);
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleSave = () => {
    if (!containerRef.current || !imageLoaded) return;

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = finalOutputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      // Calculate the visible area dimensions
      const visibleWidth = containerRect.width;
      const visibleHeight = containerRect.height;

      // Calculate the scale factor from container to output
      const scaleX = outputWidth / visibleWidth;
      const scaleY = finalOutputHeight / visibleHeight;

      // Calculate the image display dimensions in container
      const displayWidth = imageDimensions.width * zoom;
      const displayHeight = imageDimensions.height * zoom;

      // Calculate the position of the visible area relative to the image
      const centerX = visibleWidth / 2;
      const centerY = visibleHeight / 2;
      
      // Image center position in container
      const imgCenterX = centerX + position.x;
      const imgCenterY = centerY + position.y;

      // Top-left of image in container coordinates
      const imgLeft = imgCenterX - displayWidth / 2;
      const imgTop = imgCenterY - displayHeight / 2;

      // Source coordinates (what part of the original image to draw)
      const sx = Math.max(0, -imgLeft / zoom);
      const sy = Math.max(0, -imgTop / zoom);
      
      // Destination position in canvas
      const dx = Math.max(0, imgLeft) * scaleX;
      const dy = Math.max(0, imgTop) * scaleY;

      // Clear canvas with transparent or default background
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, outputWidth, finalOutputHeight);

      // Draw the image
      ctx.drawImage(
        img,
        0, 0, imageDimensions.width, imageDimensions.height,
        (position.x + (visibleWidth - displayWidth) / 2) * scaleX,
        (position.y + (visibleHeight - displayHeight) / 2) * scaleY,
        displayWidth * scaleX,
        displayHeight * scaleY
      );

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onSave(dataUrl);
    };
    img.src = imageSrc;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="text-muted-foreground"
        >
          <X className="w-5 h-5" />
        </Button>
        <h2 className="font-semibold text-foreground">Ajustar imagem</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSave}
          className="text-primary"
        >
          <Check className="w-5 h-5" />
        </Button>
      </div>

      {/* Crop Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div
          ref={containerRef}
          className={cn(
            "relative overflow-hidden bg-muted/50 border-2 border-primary/50",
            circular ? "rounded-full" : "rounded-xl"
          )}
          style={{
            width: circular ? 280 : '100%',
            maxWidth: circular ? 280 : 400,
            aspectRatio: circular ? 1 : aspectRatio,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {imageLoaded && (
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop preview"
              className="absolute pointer-events-none select-none"
              style={{
                width: imageDimensions.width * zoom,
                height: imageDimensions.height * zoom,
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
              draggable={false}
            />
          )}
          
          {/* Drag hint overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="glass-card px-3 py-1.5 rounded-full opacity-50">
              <div className="flex items-center gap-2 text-xs text-foreground">
                <Move className="w-3 h-3" />
                <span>Arraste para ajustar</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4 border-t border-border/30">
        {/* Zoom slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <ZoomIn className="w-4 h-4" />
              Zoom
            </label>
            <span className="text-sm font-medium text-foreground">{Math.round(zoom * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              min={0.5}
              max={3}
              step={0.01}
              onValueChange={handleZoomChange}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Resetar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 gradient-primary text-primary-foreground"
          >
            <Check className="w-4 h-4 mr-2" />
            Aplicar
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
