import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { AuthPage } from './AuthPage';
import { DailyPage } from './DailyPage';
import { GoalsPage } from './GoalsPage';
import { AnalyticsPage } from './AnalyticsPage';
import { SettingsPage } from './SettingsPage';
import { BottomNav } from '@/components/layout/BottomNav';
import { WelcomeModal } from '@/components/modals/WelcomeModal';

const Index = () => {
  const { isAuthenticated, activeTab, settings } = useAppStore();

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
      <main className="max-w-lg mx-auto">
        {renderPage()}
      </main>
      <BottomNav />
      <WelcomeModal />
    </div>
  );
};

export default Index;
