import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Palette, 
  Bell, 
  User, 
  Info, 
  ChevronRight,
  LogOut,
  Trash2,
  Check
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ThemeColor } from '@/types';

const THEME_OPTIONS: { id: ThemeColor; name: string; colors: string[] }[] = [
  { id: 'fire', name: 'Fogo', colors: ['#f59e0b', '#ea580c'] },
  { id: 'purple', name: 'Roxo', colors: ['#a855f7', '#c026d3'] },
  { id: 'emerald', name: 'Esmeralda', colors: ['#10b981', '#059669'] },
  { id: 'ocean', name: 'Oceano', colors: ['#0ea5e9', '#3b82f6'] },
  { id: 'rose', name: 'Rosa', colors: ['#f43f5e', '#ec4899'] },
];

export const SettingsPage = () => {
  const { settings, updateSettings, logout, user } = useAppStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.themeColor);
  }, [settings.themeColor]);

  const handleLogout = () => {
    logout();
    toast({
      title: 'Até logo!',
      description: 'Você foi desconectado',
    });
  };

  const handleDeleteAccount = () => {
    logout();
    toast({
      title: 'Conta excluída',
      description: 'Sua conta foi removida',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-20 p-4"
    >
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gradient-primary">Configurações</h1>
        <p className="text-muted-foreground">Personalize sua experiência</p>
      </header>

      <div className="space-y-4">
        {/* Theme */}
        <section className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="font-semibold text-foreground">Tema</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">Escolha seu tema</p>
              <div className="grid grid-cols-5 gap-2">
                {THEME_OPTIONS.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => updateSettings({ themeColor: theme.id })}
                    className={cn(
                      'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                      settings.themeColor === theme.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-transparent bg-muted/30 hover:bg-muted/50'
                    )}
                  >
                    <div 
                      className="w-8 h-8 rounded-full"
                      style={{ 
                        background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})` 
                      }}
                    />
                    <span className="text-xs text-foreground">{theme.name}</span>
                    {settings.themeColor === theme.id && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-medium text-foreground">Mostrar emojis</p>
                <p className="text-sm text-muted-foreground">Exibir emojis nos hábitos</p>
              </div>
              <button
                onClick={() => updateSettings({ showEmojis: !settings.showEmojis })}
                className={cn(
                  'w-12 h-6 rounded-full transition-all duration-300 relative',
                  settings.showEmojis ? 'bg-primary' : 'bg-muted'
                )}
              >
                <div
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-foreground transition-all duration-300',
                    settings.showEmojis ? 'right-1' : 'left-1'
                  )}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Bell className="w-5 h-5 text-secondary-foreground" />
            </div>
            <h2 className="font-semibold text-foreground">Notificações</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Lembretes diários</p>
                <p className="text-sm text-muted-foreground">Receba lembretes para preencher hábitos</p>
              </div>
              <button
                onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
                className={cn(
                  'w-12 h-6 rounded-full transition-all duration-300 relative',
                  settings.notificationsEnabled ? 'bg-primary' : 'bg-muted'
                )}
              >
                <div
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-foreground transition-all duration-300',
                    settings.notificationsEnabled ? 'right-1' : 'left-1'
                  )}
                />
              </button>
            </div>

            {settings.notificationsEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center justify-between"
              >
                <p className="font-medium text-foreground">Horário do lembrete</p>
                <input
                  type="time"
                  value={settings.notificationTime}
                  onChange={(e) => updateSettings({ notificationTime: e.target.value })}
                  className="bg-muted/50 border border-border/50 rounded-xl px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </motion.div>
            )}
          </div>
        </section>

        {/* Account */}
        <section className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-success flex items-center justify-center">
              <User className="w-5 h-5 text-success-foreground" />
            </div>
            <h2 className="font-semibold text-foreground">Conta</h2>
          </div>

          <div className="space-y-1">
            <div className="py-2 px-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">{user?.email || 'usuario@email.com'}</p>
            </div>

            <button className="w-full py-3 flex items-center justify-between text-left hover:bg-muted/30 rounded-xl transition-colors px-3">
              <span className="text-foreground">Alterar senha</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-3 flex items-center gap-3 text-left hover:bg-muted/30 rounded-xl transition-colors px-3"
            >
              <LogOut className="w-5 h-5 text-foreground" />
              <span className="text-foreground">Sair da conta</span>
            </button>

            {showDeleteConfirm ? (
              <div className="p-3 border border-destructive/50 rounded-xl space-y-3 bg-destructive/5">
                <p className="text-sm text-destructive">
                  Tem certeza? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 bg-muted/50 text-foreground rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-xl text-sm font-medium"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 flex items-center gap-3 text-left text-destructive hover:bg-destructive/10 rounded-xl transition-colors px-3"
              >
                <Trash2 className="w-5 h-5" />
                <span>Excluir conta</span>
              </button>
            )}
          </div>
        </section>

        {/* About */}
        <section className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Info className="w-5 h-5 text-muted-foreground" />
            </div>
            <h2 className="font-semibold text-foreground">Sobre</h2>
          </div>

          <div className="space-y-1">
            <div className="py-2 px-1 flex items-center justify-between">
              <span className="text-foreground">Versão</span>
              <span className="text-muted-foreground">1.0.0</span>
            </div>

            <button className="w-full py-3 flex items-center justify-between text-left hover:bg-muted/30 rounded-xl transition-colors px-3">
              <span className="text-foreground">Termos de uso</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button className="w-full py-3 flex items-center justify-between text-left hover:bg-muted/30 rounded-xl transition-colors px-3">
              <span className="text-foreground">Política de privacidade</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  );
};
