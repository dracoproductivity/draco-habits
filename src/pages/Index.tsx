import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { AuthPage } from './AuthPage';
import { DailyPage } from './DailyPage';
import { GoalsPage } from './GoalsPage';
import { AnalyticsPage } from './AnalyticsPage';
import { SettingsPage } from './SettingsPage';
import { BottomNav } from '@/components/layout/BottomNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { WelcomeModal } from '@/components/modals/WelcomeModal';
import { MorningCheckInModal } from '@/components/modals/MorningCheckInModal';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const Index = () => {
  const { isAuthenticated, activeTab, settings } = useAppStore();
  const { isDesktop, isTablet } = useResponsive();
  const [showMorningCheckIn, setShowMorningCheckIn] = useState(false);

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
      {/* Desktop Sidebar */}
      {isDesktop && <DesktopSidebar />}
      
      {/* Main Content */}
      <main className={cn(
        'transition-all duration-300',
        isDesktop ? 'ml-64 px-8' : isTablet ? 'max-w-2xl mx-auto px-6' : 'max-w-lg mx-auto'
      )}>
        {renderPage()}
      </main>
      
      {/* Bottom Nav - Only for mobile and tablet */}
      {!isDesktop && <BottomNav />}
      
      <WelcomeModal />
      <MorningCheckInModal 
        isOpen={showMorningCheckIn} 
        onClose={() => setShowMorningCheckIn(false)} 
      />
    </div>
  );
};

export default Index;
