import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { useCloudSync } from '@/hooks/useCloudSync';
import { AuthPage } from './AuthPage';
import { DailyPage } from './DailyPage';
import { GoalsPage } from './GoalsPage';
import { AnalyticsPage } from './AnalyticsPage';
import { SettingsPage } from './SettingsPage';
import { BottomNav } from '@/components/layout/BottomNav';
import { DesktopBottomNav } from '@/components/layout/DesktopBottomNav';
import { WelcomeModal } from '@/components/modals/WelcomeModal';
import { MorningCheckInModal } from '@/components/modals/MorningCheckInModal';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { activeTab, settings } = useAppStore();
  const { isAuthenticated, loading, user } = useAuth();
  const { isDesktop, isTablet } = useResponsive();
  const [showMorningCheckIn, setShowMorningCheckIn] = useState(false);
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
  }, [settings.themeColor, settings.darkMode]);

  // Check if morning check-in should be shown - only once per day after 5am
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const currentHour = new Date().getHours();
    const today = format(new Date(), 'yyyy-MM-dd');
    const accountCreatedAt = settings.accountCreatedAt;
    
    // Don't show on the same day the account was created
    if (accountCreatedAt === today) {
      return;
    }
    
    // Only show after 5am and if not already filled today
    // The lastDailyLogDate check ensures it only shows once per day
    if (currentHour >= 5 && settings.lastDailyLogDate !== today) {
      setShowMorningCheckIn(true);
    }
  }, [isAuthenticated]); // Only run on mount/auth change, not on every settings change

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
      case 'daily':
        return <DailyPage />;
      case 'goals':
        return <GoalsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DailyPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className={cn(
        'transition-all duration-300',
        isDesktop ? 'max-w-6xl mx-auto px-8 pb-24' : isTablet ? 'max-w-2xl mx-auto px-6' : 'max-w-lg mx-auto'
      )}>
        {renderPage()}
      </main>
      
      {/* Bottom Nav - Desktop uses glass style, mobile/tablet uses regular */}
      {isDesktop ? <DesktopBottomNav /> : <BottomNav />}
      
      <WelcomeModal />
      <MorningCheckInModal 
        isOpen={showMorningCheckIn} 
        onClose={() => setShowMorningCheckIn(false)} 
      />
    </div>
  );
};

export default Index;
