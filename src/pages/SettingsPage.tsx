import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Palette, 
  Bell, 
  User, 
  Info, 
  ChevronRight,
  LogOut,
  Trash2,
  Smile
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const SettingsPage = () => {
  const { settings, updateSettings, logout, user } = useAppStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    toast({
      title: 'Até logo!',
      description: 'Você foi desconectado',
    });
  };

  const handleDeleteAccount = () => {
    // In a real app, this would delete the account
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
        <h1 className="text-2xl font-bold text-gradient-fire">Configurações</h1>
        <p className="text-muted-foreground">Personalize sua experiência</p>
      </header>

      <div className="space-y-6">
        {/* Visual Customization */}
        <section className="card-dark p-4 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl gradient-fire flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="font-semibold">Personalização Visual</h2>
          </div>

          <div className="space-y-4 pl-13">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mostrar emojis</p>
                <p className="text-sm text-muted-foreground">Exibir emojis nos objetivos e hábitos</p>
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
        <section className="card-dark p-4 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center">
              <Bell className="w-5 h-5 text-secondary-foreground" />
            </div>
            <h2 className="font-semibold">Notificações</h2>
          </div>

          <div className="space-y-4 pl-13">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Lembretes diários</p>
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
                <p className="font-medium">Horário do lembrete</p>
                <input
                  type="time"
                  value={settings.notificationTime}
                  onChange={(e) => updateSettings({ notificationTime: e.target.value })}
                  className="input-dark px-3 py-1"
                />
              </motion.div>
            )}
          </div>
        </section>

        {/* Account */}
        <section className="card-dark p-4 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-success flex items-center justify-center">
              <User className="w-5 h-5 text-success-foreground" />
            </div>
            <h2 className="font-semibold">Conta</h2>
          </div>

          <div className="space-y-2 pl-13">
            <div className="py-2">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email || 'usuario@email.com'}</p>
            </div>

            <button className="w-full py-3 flex items-center justify-between text-left hover:bg-muted/50 rounded-xl transition-colors px-3 -mx-3">
              <span>Alterar senha</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-3 flex items-center gap-3 text-left hover:bg-muted/50 rounded-xl transition-colors px-3 -mx-3"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair da conta</span>
            </button>

            {showDeleteConfirm ? (
              <div className="p-3 border border-destructive rounded-xl space-y-3">
                <p className="text-sm text-destructive">
                  Tem certeza? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn-ghost flex-1 py-2 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-xl text-sm"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 flex items-center gap-3 text-left text-destructive hover:bg-destructive/10 rounded-xl transition-colors px-3 -mx-3"
              >
                <Trash2 className="w-5 h-5" />
                <span>Excluir conta</span>
              </button>
            )}
          </div>
        </section>

        {/* About */}
        <section className="card-dark p-4 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Info className="w-5 h-5 text-muted-foreground" />
            </div>
            <h2 className="font-semibold">Sobre</h2>
          </div>

          <div className="space-y-2 pl-13">
            <div className="py-2 flex items-center justify-between">
              <span>Versão</span>
              <span className="text-muted-foreground">1.0.0</span>
            </div>

            <button className="w-full py-3 flex items-center justify-between text-left hover:bg-muted/50 rounded-xl transition-colors px-3 -mx-3">
              <span>Termos de uso</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button className="w-full py-3 flex items-center justify-between text-left hover:bg-muted/50 rounded-xl transition-colors px-3 -mx-3">
              <span>Política de privacidade</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  );
};
