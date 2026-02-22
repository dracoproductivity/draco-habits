import { useState, useRef, useEffect } from 'react';
import { User, Bell, Sun, Moon, X, Settings, Heart } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { DracoIcon } from '@/components/icons/DracoIcon';
import { XPBar } from '@/components/ui/XPBar';
import { useResponsive } from '@/hooks/useResponsive';
import { useNavigate } from 'react-router-dom';
import dracoLogo from '@/assets/draco-logo-new.png';

export const UniversalHeader = () => {
  const { user, draco, settings, updateSettings, setActiveTab } = useAppStore();
  const { isDesktop, isMobile } = useResponsive();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDracoSavesInfo, setShowDracoSavesInfo] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);

  // Draco Saves animation state
  const [animDelta, setAnimDelta] = useState<number | null>(null);
  const prevDelta = useRef<number | null>(null);

  useEffect(() => {
    const delta = settings.dracoSavesDelta;
    if (delta !== null && delta !== undefined && delta !== prevDelta.current) {
      setAnimDelta(delta);
      prevDelta.current = delta;
      const timer = setTimeout(() => {
        setAnimDelta(null);
        updateSettings({ dracoSavesDelta: null });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [settings.dracoSavesDelta]);

  const remindersArr = Array.isArray(settings.notificationReminders) ? settings.notificationReminders : [];
  const notifications = remindersArr.filter(
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

  const dracoSaves = settings.dracoSaves || 0;

  // ── Draco Saves Info Popup content ──
  const dracoSavesPopup = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-72 glass-card rounded-2xl p-4 shadow-2xl border border-border/50"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary fill-primary" />
          <h4 className="text-sm font-semibold text-foreground">O que são Draco Saves?</h4>
        </div>
        <button onClick={() => setShowDracoSavesInfo(false)} className="p-1 rounded-lg hover:bg-muted/50 transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Draco Saves são salvadores de streaks que você pode utilizar para não perder a streak de um hábito ou de dias. Ao completar 1 hábito você ganha 1 Draco Save, mas para salvar uma streak você precisa utilizar 20 Draco Saves do seu saldo. Utilize com cuidado e sabedoria.
      </p>
      <div className="mt-3 p-2 rounded-lg bg-muted/30 border border-border/30">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Seu saldo</span>
          <span className="text-sm font-bold text-primary">{dracoSaves}</span>
        </div>
      </div>
    </motion.div>
  );

  // ── Notifications Popup content ──
  const notificationsPopup = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-72 glass-card rounded-2xl p-3 shadow-2xl border border-border/50"
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
              <button onClick={() => dismissOne(n.id)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">✕</button>
            </div>
          ))}
        </div>
      )}
      {notifications.length > 0 && (
        <button onClick={clearAll} className="w-full mt-2 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/30 transition-all">
          Limpar tudo
        </button>
      )}
    </motion.div>
  );

  // ── Action buttons (Draco Saves, Dark Mode, Notifications) ──
  const actionButtons = (
    <>
      {/* Draco Saves */}
      <div className="relative">
        <button
          onClick={() => setShowDracoSavesInfo(!showDracoSavesInfo)}
          className="flex flex-col items-center gap-0 w-8 h-10 justify-center"
        >
          <Heart className="w-5 h-5 text-primary fill-primary" />
          <span className="text-[9px] font-medium text-muted-foreground leading-none">{dracoSaves}</span>
        </button>
        {/* Delta Animation */}
        <AnimatePresence>
          {animDelta !== null && (
            <motion.div
              key={animDelta}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -20 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
            >
              <span className={`text-xs font-bold ${animDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {animDelta > 0 ? `+${animDelta}` : animDelta}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Desktop: popover positioned relative */}
        {!isMobile && (
          <AnimatePresence>
            {showDracoSavesInfo && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute right-0 top-12 z-50"
              >
                {dracoSavesPopup}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

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
        {/* Desktop: popover positioned relative */}
        {!isMobile && (
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute right-0 top-10 z-50"
              >
                {notificationsPopup}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

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
    </>
  );

  return (
    <>
      <header className={isMobile ? "px-4 py-3" : "flex items-center justify-between px-4 py-3"}>
        {isMobile ? (
          <>
            {/* Mobile Row 1: Logo + "Habits" | Action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={dracoLogo} alt="Draco Habits" className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-lg text-foreground">Habits</span>
              </div>
              <div className="flex items-center gap-2">
                {actionButtons}
              </div>
            </div>

            {/* Mobile Row 2: User photo | Draco info */}
            <div className="flex items-center justify-between mt-2">
              {/* User photo (far left) */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/30"
                >
                  {user?.photo ? (
                    <img src={user.photo} alt={user.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      className="absolute left-0 top-12 z-50 w-44 glass-card rounded-xl p-2 shadow-2xl border border-border/50"
                    >
                      <button
                        onClick={() => { setActiveTab('settings'); setShowProfileMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        Configurações
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Draco info (far right) */}
              <div className="flex items-center gap-2">
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
          </>
        ) : (
          <>
            {/* Desktop: Single row layout */}
            {/* Left side - Logo + App name + User photo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
                <img src={dracoLogo} alt="Draco Habits" className="w-full h-full object-cover" />
              </div>
              {isDesktop && (
                <span className="font-bold text-lg text-foreground mr-2">Draco Habits</span>
              )}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/30"
                >
                  {user?.photo ? (
                    <img src={user.photo} alt={user.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      className="absolute left-0 top-12 z-50 w-44 glass-card rounded-xl p-2 shadow-2xl border border-border/50"
                    >
                      <button
                        onClick={() => { setActiveTab('settings'); setShowProfileMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        Configurações
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right side - Action buttons + Draco info */}
            <div className="flex items-center gap-2">
              {actionButtons}

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
          </>
        )}
      </header>

      {/* Mobile: Centered popups via portal */}
      {isMobile && createPortal(
        <AnimatePresence>
          {showDracoSavesInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onClick={() => setShowDracoSavesInfo(false)}
            >
              <div onClick={e => e.stopPropagation()}>
                {dracoSavesPopup}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {isMobile && createPortal(
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onClick={() => setShowNotifications(false)}
            >
              <div onClick={e => e.stopPropagation()}>
                {notificationsPopup}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
