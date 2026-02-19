import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Check, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ImageCropperProps {
  imageSrc: string;
  aspectRatio?: number;
  onSave: (croppedDataUrl: string) => void;
  onCancel: () => void;
  outputWidth?: number;
  outputHeight?: number;
  className?: string;
  circular?: boolean;
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
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [cSize, setCSize] = useState({ w: 0, h: 0 });
  const lastPinch = useRef<number | null>(null);
  const lastPinchZoom = useRef(1);

  const finalOutputHeight = outputHeight || Math.round(outputWidth / aspectRatio);

  // ── Fit-to-cover base size: image scaled so it covers the container ──
  const getCoverSize = useCallback(() => {
    if (!nat.w || !nat.h || !cSize.w || !cSize.h) return { w: 0, h: 0 };
    const imgAspect = nat.w / nat.h;
    const cAspect = cSize.w / cSize.h;
    if (imgAspect > cAspect) {
      // Image wider than container → fit by height
      return { w: cSize.h * imgAspect, h: cSize.h };
    } else {
      // Image taller → fit by width
      return { w: cSize.w, h: cSize.w / imgAspect };
    }
  }, [nat, cSize]);

  // ── Clamp position so image always covers viewport ──
  const clampPos = useCallback((pos: { x: number; y: number }, z?: number) => {
    const currentZoom = z ?? zoom;
    const cover = getCoverSize();
    const dw = cover.w * currentZoom;
    const dh = cover.h * currentZoom;
    const maxX = Math.max(0, (dw - cSize.w) / 2);
    const maxY = Math.max(0, (dh - cSize.h) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, pos.x)),
      y: Math.min(maxY, Math.max(-maxY, pos.y)),
    };
  }, [zoom, getCoverSize, cSize]);

  // ── Load image ──
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setNat({ w: img.naturalWidth, h: img.naturalHeight });
      setImageLoaded(true);
      setPosition({ x: 0, y: 0 });
      setZoom(1);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // ── Container size observer ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setCSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Mouse/pointer drag ──
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...position };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || e.pointerType === 'touch') return;
    setPosition(clampPos({
      x: posStart.current.x + (e.clientX - dragStart.current.x),
      y: posStart.current.y + (e.clientY - dragStart.current.y),
    }));
  }, [isDragging, clampPos]);

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  // ── Touch: single-finger drag + pinch-to-zoom ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      posStart.current = { ...position };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinch.current = Math.hypot(dx, dy);
      lastPinchZoom.current = zoom;
    }
  }, [position, zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      setPosition(clampPos({
        x: posStart.current.x + (e.touches[0].clientX - dragStart.current.x),
        y: posStart.current.y + (e.touches[0].clientY - dragStart.current.y),
      }));
    } else if (e.touches.length === 2 && lastPinch.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const newZoom = Math.min(5, Math.max(1, lastPinchZoom.current * (dist / lastPinch.current)));
      setZoom(newZoom);
      setPosition(prev => clampPos(prev, newZoom));
    }
  }, [isDragging, clampPos]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    lastPinch.current = null;
  }, []);

  // ── Mouse wheel zoom ──
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = Math.min(5, Math.max(1, zoom - e.deltaY * 0.002));
    setZoom(newZoom);
    setPosition(prev => clampPos(prev, newZoom));
  }, [zoom, clampPos]);

  const handleZoomChange = (value: number[]) => {
    const nz = value[0];
    setZoom(nz);
    setPosition(prev => clampPos(prev, nz));
  };

  const handleReset = () => { setZoom(1); setPosition({ x: 0, y: 0 }); };

  // ── Save / crop ──
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
      const cover = getCoverSize();
      const dw = cover.w * zoom;
      const dh = cover.h * zoom;
      // Image top-left in container coords
      const imgLeft = (cSize.w - dw) / 2 + position.x;
      const imgTop = (cSize.h - dh) / 2 + position.y;
      // Scale from container to output
      const sx = outputWidth / cSize.w;
      const sy = finalOutputHeight / cSize.h;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, outputWidth, finalOutputHeight);
      ctx.drawImage(img, 0, 0, nat.w, nat.h, imgLeft * sx, imgTop * sy, dw * sx, dh * sy);
      onSave(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = imageSrc;
  };

  const cover = getCoverSize();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn("fixed inset-0 z-[60] flex flex-col bg-background/95 backdrop-blur-sm", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <Button variant="ghost" size="icon" onClick={onCancel} className="text-muted-foreground">
          <X className="w-5 h-5" />
        </Button>
        <h2 className="font-semibold text-foreground">Ajustar imagem</h2>
        <Button variant="ghost" size="icon" onClick={handleSave} className="text-primary">
          <Check className="w-5 h-5" />
        </Button>
      </div>

      {/* Crop Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden bg-black/30">
        <div
          ref={containerRef}
          className={cn(
            "relative overflow-hidden bg-black",
            circular ? "rounded-full" : "rounded-xl",
            "border-2 border-white/20"
          )}
          style={{
            width: circular ? 280 : '100%',
            maxWidth: circular ? 280 : 400,
            aspectRatio: circular ? 1 : aspectRatio,
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          {imageLoaded && cover.w > 0 && (
            <img
              src={imageSrc}
              alt="Crop preview"
              className="absolute pointer-events-none select-none"
              style={{
                width: cover.w,
                height: cover.h,
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
              draggable={false}
            />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4 border-t border-border/30">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <ZoomIn className="w-4 h-4" /> Zoom
            </label>
            <span className="text-sm font-medium text-foreground">{Math.round(zoom * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
            <Slider value={[zoom]} min={1} max={5} step={0.01} onValueChange={handleZoomChange} className="flex-1" />
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            <RotateCcw className="w-4 h-4 mr-2" /> Resetar
          </Button>
          <Button onClick={handleSave} className="flex-1 gradient-primary text-primary-foreground">
            <Check className="w-4 h-4 mr-2" /> Aplicar
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
