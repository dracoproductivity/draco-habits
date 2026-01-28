import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Sun, Moon, Upload, X, Check } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

// Sample wallpapers (can be replaced with actual URLs)
const SAMPLE_WALLPAPERS = {
  light: [
    { id: 'light-1', name: 'Natureza', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { id: 'light-2', name: 'Praia', gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' },
    { id: 'light-3', name: 'Pôr do Sol', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    { id: 'light-4', name: 'Floresta', gradient: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)' },
    { id: 'light-5', name: 'Montanha', gradient: 'linear-gradient(135deg, #c1dfc4 0%, #deecdd 100%)' },
  ],
  dark: [
    { id: 'dark-1', name: 'Noite', gradient: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%)' },
    { id: 'dark-2', name: 'Galáxia', gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
    { id: 'dark-3', name: 'Aurora', gradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
    { id: 'dark-4', name: 'Oceano', gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
    { id: 'dark-5', name: 'Cosmos', gradient: 'linear-gradient(135deg, #000428 0%, #004e92 100%)' },
  ],
};

export const WallpaperSection = () => {
  const { settings, updateSettings } = useAppStore();
  const [activeMode, setActiveMode] = useState<'light' | 'dark'>('dark');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O tamanho máximo é 5MB',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (activeMode === 'light') {
          updateSettings({ wallpaperLight: result });
        } else {
          updateSettings({ wallpaperDark: result });
        }
        toast({
          title: 'Wallpaper atualizado! 🎨',
          description: `Wallpaper do modo ${activeMode === 'light' ? 'claro' : 'escuro'} alterado`,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const selectWallpaper = (gradient: string) => {
    if (activeMode === 'light') {
      updateSettings({ wallpaperLight: gradient });
    } else {
      updateSettings({ wallpaperDark: gradient });
    }
    toast({
      title: 'Wallpaper selecionado! 🎨',
    });
  };

  const clearWallpaper = () => {
    if (activeMode === 'light') {
      updateSettings({ wallpaperLight: undefined });
    } else {
      updateSettings({ wallpaperDark: undefined });
    }
    toast({
      title: 'Wallpaper removido',
    });
  };

  const currentWallpaper = activeMode === 'light' ? settings.wallpaperLight : settings.wallpaperDark;
  const samples = activeMode === 'light' ? SAMPLE_WALLPAPERS.light : SAMPLE_WALLPAPERS.dark;

  return (
    <section className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
          <Image className="w-5 h-5 text-primary-foreground" />
        </div>
        <h2 className="font-semibold text-foreground">Wallpaper</h2>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveMode('light')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all',
            activeMode === 'light'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}
        >
          <Sun className="w-4 h-4" />
          <span className="text-sm font-medium">Modo Claro</span>
        </button>
        <button
          onClick={() => setActiveMode('dark')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all',
            activeMode === 'dark'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}
        >
          <Moon className="w-4 h-4" />
          <span className="text-sm font-medium">Modo Escuro</span>
        </button>
      </div>

      {/* Current Wallpaper Preview */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">Wallpaper atual</p>
        <div 
          className="h-24 rounded-xl border border-border/50 overflow-hidden relative"
          style={{
            background: currentWallpaper?.startsWith('linear-gradient') || currentWallpaper?.startsWith('data:')
              ? (currentWallpaper.startsWith('data:') ? `url(${currentWallpaper}) center/cover` : currentWallpaper)
              : 'hsl(var(--background))',
          }}
        >
          {currentWallpaper?.startsWith('data:') && (
            <img 
              src={currentWallpaper} 
              alt="Wallpaper preview" 
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          
          {/* Glass card preview */}
          <div className="absolute inset-4 flex items-center justify-center">
            <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-xl p-3 shadow-lg">
              <p className="text-xs text-foreground font-medium">Prévia do card</p>
            </div>
          </div>

          {currentWallpaper && (
            <button
              onClick={clearWallpaper}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center hover:bg-destructive transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Sample Wallpapers */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">Escolha um wallpaper</p>
        <div className="grid grid-cols-5 gap-2">
          {samples.map((sample) => (
            <button
              key={sample.id}
              onClick={() => selectWallpaper(sample.gradient)}
              className={cn(
                'aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all hover:scale-105',
                currentWallpaper === sample.gradient
                  ? 'border-primary ring-2 ring-primary/50'
                  : 'border-border/50'
              )}
              style={{ background: sample.gradient }}
              title={sample.name}
            >
              {currentWallpaper === sample.gradient && (
                <div className="w-full h-full flex items-center justify-center bg-primary/30">
                  <Check className="w-4 h-4 text-white drop-shadow-md" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Custom */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-border/50 rounded-xl text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
      >
        <Upload className="w-4 h-4" />
        <span className="text-sm">Enviar imagem personalizada</span>
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Tamanho máximo: 5MB
      </p>
    </section>
  );
};
