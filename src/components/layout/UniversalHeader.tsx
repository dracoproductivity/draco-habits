import { useState } from 'react';
import { User, Bell, Sun, Moon, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { DracoIcon } from '@/components/icons/DracoIcon';
import { XPBar } from '@/components/ui/XPBar';
import { useResponsive } from '@/hooks/useResponsive';
import dracoLogo from '@/assets/draco-logo-new.png';

export const UniversalHeader = () => {
  const { user, draco, settings, updateSettings } = useAppStore();
  const { isDesktop } = useResponsive();
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);

  const notifications = (settings.notificationReminders || []).filter(
    r => r.enabled && !dismissedNotifications.includes(r.id)
  );

  const clearAll = () => {
    setDismissedNotifications(notifications.map(n => n.id));
    setShowNotifications(false);
  };

  const dismissOne = (id: string) => {
    setDismissedNotifications(prev => [...prev, id]);
  };

  const toggleDarkMode = () => {
    updateSettings({ darkMode: !settings.darkMode });
  };

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3">
        {/* Left side - Logo + App name + User photo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
            <img src={dracoLogo} alt="Draco Habits" className="w-full h-full object-cover" />
          </div>
          {isDesktop && (
            <span className="font-bold text-lg text-foreground mr-2">Draco Habits</span>
          )}
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/30">
            {user?.photo ? (
              <img src={user.photo} alt={user.firstName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Right side - Dark mode + Notifications + Draco & XP */}
        <div className="flex items-center gap-2">
          {/* Dark/Light mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-8 h-8 rounded-xl glass-card flex items-center justify-center hover:border-primary/40 transition-all"
          >
            {settings.darkMode ? (
              <Sun className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-8 h-8 rounded-xl glass-card flex items-center justify-center hover:border-primary/40 transition-all relative"
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                  {notifications.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute right-0 top-10 z-50 w-72 glass-card rounded-2xl p-3 shadow-2xl border border-border/50"
                >
                  <h4 className="text-sm font-semibold text-foreground mb-2">Notificações</h4>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Nenhuma notificação</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="flex items-start gap-2 p-2 rounded-xl bg-muted/30">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">🕐 {n.time}</p>
                          </div>
                          <button
                            onClick={() => dismissOne(n.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="w-full mt-2 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/30 transition-all"
                    >
                      Limpar tudo
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Draco info */}
          <div className="flex items-center gap-2 ml-1">
            <div className="flex flex-col items-end">
              <span className="text-sm text-primary font-semibold">{draco.name}</span>
              <span className="text-xs text-muted-foreground">Nível {draco.level}</span>
              <XPBar
                currentXP={draco.currentXP}
                xpToNextLevel={draco.xpToNextLevel}
                level={draco.level}
                showLabel={false}
                className="w-24"
              />
            </div>
            <div className="w-12 h-12">
              <DracoIcon level={draco.level} color={draco.color} />
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
