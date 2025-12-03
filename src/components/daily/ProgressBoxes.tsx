import { useAppStore } from '@/store/useAppStore';
import { ProgressCircle } from '@/components/ui/ProgressCircle';

export const ProgressBoxes = () => {
  const { getDailyProgress, getWeeklyProgress } = useAppStore();
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // Get the start of the current week (Monday)
  const getWeekStart = () => {
    const d = new Date(today);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

  const dailyProgress = getDailyProgress(todayStr);
  const weeklyProgress = getWeeklyProgress(getWeekStart());

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="card-dark p-4 flex flex-col items-center">
        <ProgressCircle progress={dailyProgress} size={70} label="Hoje" />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Progresso diário
        </p>
      </div>

      <div className="card-dark p-4 flex flex-col items-center">
        <ProgressCircle progress={weeklyProgress} size={70} label="Semana" />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Progresso semanal
        </p>
      </div>
    </div>
  );
};
