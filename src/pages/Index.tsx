import { useAppStore } from '@/store/useAppStore';
import { AuthPage } from './AuthPage';
import { DailyPage } from './DailyPage';
import { YearPage } from './YearPage';
import { GoalsPage } from './GoalsPage';
import { ProfilePage } from './ProfilePage';
import { SettingsPage } from './SettingsPage';
import { BottomNav } from '@/components/layout/BottomNav';
import { WelcomeModal } from '@/components/modals/WelcomeModal';

const Index = () => {
  const { isAuthenticated, activeTab } = useAppStore();

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'daily':
        return <DailyPage />;
      case 'year':
        return <YearPage />;
      case 'goals':
        return <GoalsPage />;
      case 'profile':
        return <ProfilePage />;
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
