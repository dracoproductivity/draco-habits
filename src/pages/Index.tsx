import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { useCloudSync } from '@/hooks/useCloudSync';
import { AuthPage } from './AuthPage';
import { DailyPage } from './DailyPage';
import { GoalsPage } from './GoalsPage';
import { NotesPage } from './NotesPage';
import { AnalyticsPage } from './AnalyticsPage';
import { DataPage } from './DataPage';
import { SettingsPage } from './SettingsPage';
import { BottomNav } from '@/components/layout/BottomNav';
import { DesktopBottomNav } from '@/components/layout/DesktopBottomNav';
import { AppBackground } from '@/components/layout/AppBackground';
import { WelcomeModal } from '@/components/modals/WelcomeModal';
import { MorningCheckInModal } from '@/components/modals/MorningCheckInModal';
import { DailyLogReminder } from '@/components/daily/DailyLogReminder';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const Index = () => {
  const { activeTab, settings } = useAppStore();
  const { isAuthenticated, loading, user } = useAuth();
  const { isDesktop, isTablet } = useResponsive();
  const [showMorningCheckIn, setShowMorningCheckIn] = useState(false);
  const [showDailyLogReminder, setShowDailyLogReminder] = useState(false);
  const prevUserIdRef = useRef<string | null>(null);
  
  // Initialize cloud sync - this handles loading data from cloud
  useCloudSync();

  // Clear store when user changes or logs out
  useEffect(() => {
    if (!isAuthenticated && prevUserIdRef.current) {
      // User logged out - store should already be cleared by logout function
      prevUserIdRef.current = null;
    } else if (isAuthenticated && user?.id && prevUserIdRef.current !== user.id) {
      // New user logged in
      prevUserIdRef.current = user.id;
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.themeColor);
    document.documentElement.classList.toggle('dark', settings.darkMode);
    
    // Apply custom color if theme is custom
    if (settings.themeColor === 'custom' && settings.customColor) {
      const { h, s, l } = settings.customColor;
      document.documentElement.style.setProperty('--custom-h', h.toString());
      document.documentElement.style.setProperty('--custom-s', `${s}%`);
      document.documentElement.style.setProperty('--custom-l', `${l}%`);
    }
    
    // Apply glass blur and opacity settings
    const blur = settings.glassBlur ?? 20;
    const opacity = settings.glassOpacity ?? 65;
    document.documentElement.style.setProperty('--glass-blur', blur.toString());
    document.documentElement.style.setProperty('--glass-opacity', opacity.toString());
  }, [settings.themeColor, settings.darkMode, settings.customColor, settings.glassBlur, settings.glassOpacity]);

  // Check if morning check-in should be shown - only once per session after 5am
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const currentHour = new Date().getHours();
    const today = format(new Date(), 'yyyy-MM-dd');
    const accountCreatedAt = settings.accountCreatedAt;
    
    // Don't show on the same day the account was created
    if (accountCreatedAt === today) {
      return;
    }
    
    // Check if user already dismissed the modal today (stored in sessionStorage)
    const dismissedToday = sessionStorage.getItem('morningCheckInDismissed') === today;
    
    // Only show after 5am and if not already filled today and not dismissed this session
    if (currentHour >= 5 && settings.lastDailyLogDate !== today && !dismissedToday) {
      setShowMorningCheckIn(true);
      setShowDailyLogReminder(false);
    } else if (currentHour >= 5 && settings.lastDailyLogDate !== today && dismissedToday) {
      // User dismissed but didn't log - show reminder
      setShowDailyLogReminder(true);
    }
  }, [isAuthenticated]); // Only run on mount/auth change, not on every settings change

  const handleMorningCheckInClose = () => {
    setShowMorningCheckIn(false);
    // Store in sessionStorage that user dismissed today
    const today = format(new Date(), 'yyyy-MM-dd');
    sessionStorage.setItem('morningCheckInDismissed', today);
    // Check if user actually logged - if not, show reminder
    if (settings.lastDailyLogDate !== today) {
      setShowDailyLogReminder(true);
    }
  };

  const handleReminderClick = () => {
    setShowDailyLogReminder(false);
    setShowMorningCheckIn(true);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <DailyPage />;
      case 'goals':
        return <GoalsPage />;
      case 'notes':
        return <NotesPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'data':
        return <DataPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DailyPage />;
    }
  };

  return (
    <AppBackground>
      {/* Main Content */}
      <main className={cn(
        'transition-all duration-300 pt-4',
        isDesktop ? 'max-w-7xl mx-auto px-8 pb-24' : isTablet ? 'max-w-2xl mx-auto px-6' : 'max-w-lg mx-auto'
      )}>
        {renderPage()}
      </main>
      
      {/* Bottom Nav - Desktop uses glass style, mobile/tablet uses regular */}
      {isDesktop ? <DesktopBottomNav /> : <BottomNav />}
      
      <WelcomeModal />
      <MorningCheckInModal 
        isOpen={showMorningCheckIn} 
        onClose={handleMorningCheckInClose} 
      />
      <AnimatePresence>
        {showDailyLogReminder && activeTab === 'home' && (
          <DailyLogReminder onClick={handleReminderClick} />
        )}
      </AnimatePresence>
    </AppBackground>
  );
};

export default Index;
