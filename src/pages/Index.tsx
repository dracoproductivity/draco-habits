import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { AuthPage } from './AuthPage';
import { DailyPage } from './DailyPage';
import { GoalsPage } from './GoalsPage';
import { AnalyticsPage } from './AnalyticsPage';
import { SettingsPage } from './SettingsPage';
import { BottomNav } from '@/components/layout/BottomNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { WelcomeModal } from '@/components/modals/WelcomeModal';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

const Index = () => {
  const { isAuthenticated, activeTab, settings } = useAppStore();
  const { isDesktop, isTablet } = useResponsive();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.themeColor);
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings.themeColor, settings.darkMode]);

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
    </div>
  );
};

export default Index;
