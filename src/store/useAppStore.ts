import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Habit, HabitCheck, Goal, DracoState, AppSettings, TabType, GoalType } from '@/types';

interface AppStore {
  // Auth
  isAuthenticated: boolean;
  isFirstTime: boolean;
  user: User | null;
  
  // Draco
  draco: DracoState;
  
  // Habits
  habits: Habit[];
  habitChecks: HabitCheck[];
  
  // Goals
  goals: Goal[];
  
  // Settings
  settings: AppSettings;
  
  // UI
  activeTab: TabType;
  showWelcomeModal: boolean;
  
  // Actions
  login: (email: string, password: string) => boolean;
  signup: (user: Omit<User, 'id'>, password: string) => boolean;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  removeHabit: (id: string) => void;
  toggleHabitCheck: (habitId: string, date: string) => void;
  
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
  
  updateSettings: (settings: Partial<AppSettings>) => void;
  setActiveTab: (tab: TabType) => void;
  closeWelcomeModal: () => void;
  
  addXP: (amount: number) => void;
  
  getHabitCheckForDate: (habitId: string, date: string) => HabitCheck | undefined;
  getDailyProgress: (date: string) => number;
  getWeeklyProgress: (weekStart: string) => number;
  getMonthlyProgress: (year: number, month: number) => number;
}

const calculateXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

const defaultDraco: DracoState = {
  level: 1,
  currentXP: 0,
  xpToNextLevel: 100,
  totalXP: 0,
};

const defaultSettings: AppSettings = {
  themeColor: 'fire',
  progressDisplayMode: 'linear',
  showEmojis: true,
  notificationsEnabled: true,
  notificationTime: '09:00',
};

const defaultHabits: Habit[] = [
  { id: '1', name: 'Meditar', emoji: '🧘', xpReward: 25, createdAt: new Date().toISOString() },
  { id: '2', name: 'Exercício', emoji: '💪', xpReward: 30, createdAt: new Date().toISOString() },
  { id: '3', name: 'Leitura', emoji: '📚', xpReward: 20, createdAt: new Date().toISOString() },
  { id: '4', name: 'Água', emoji: '💧', xpReward: 15, createdAt: new Date().toISOString() },
  { id: '5', name: 'Sono 8h', emoji: '😴', xpReward: 25, createdAt: new Date().toISOString() },
];

const defaultGoals: Goal[] = [
  { id: '1', name: 'Ler 12 livros', emoji: '📖', type: 'yearly', period: '2025', progress: 25, createdAt: new Date().toISOString() },
  { id: '2', name: 'Perder 5kg', emoji: '⚖️', type: 'quarterly', period: 'Q1-2025', progress: 40, createdAt: new Date().toISOString() },
  { id: '3', name: 'Completar curso', emoji: '🎓', type: 'monthly', period: 'Dezembro 2025', progress: 60, createdAt: new Date().toISOString() },
];

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isFirstTime: true,
      user: null,
      draco: defaultDraco,
      habits: defaultHabits,
      habitChecks: [],
      goals: defaultGoals,
      settings: defaultSettings,
      activeTab: 'daily',
      showWelcomeModal: false,

      login: (email, password) => {
        if (email && password) {
          set({ 
            isAuthenticated: true,
            user: {
              id: '1',
              email,
              firstName: 'Usuário',
              lastName: 'Demo',
              age: 25,
              photo: '',
            }
          });
          return true;
        }
        return false;
      },

      signup: (userData, password) => {
        if (userData.email && password) {
          set({ 
            isAuthenticated: true,
            isFirstTime: true,
            showWelcomeModal: true,
            user: {
              ...userData,
              id: Date.now().toString(),
            }
          });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ 
          isAuthenticated: false, 
          user: null,
          isFirstTime: true,
        });
      },

      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },

      addHabit: (habit) => {
        const newHabit: Habit = {
          ...habit,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ habits: [...state.habits, newHabit] }));
      },

      removeHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          habitChecks: state.habitChecks.filter((hc) => hc.habitId !== id),
        }));
      },

      toggleHabitCheck: (habitId, date) => {
        const { habitChecks, habits, addXP } = get();
        const existing = habitChecks.find(
          (hc) => hc.habitId === habitId && hc.date === date
        );
        
        const habit = habits.find((h) => h.id === habitId);
        
        if (existing) {
          if (existing.completed && habit) {
            // Remove XP when unchecking
          }
          set({
            habitChecks: habitChecks.map((hc) =>
              hc.habitId === habitId && hc.date === date
                ? { ...hc, completed: !hc.completed }
                : hc
            ),
          });
          if (!existing.completed && habit) {
            addXP(habit.xpReward);
          }
        } else {
          set({
            habitChecks: [...habitChecks, { habitId, date, completed: true }],
          });
          if (habit) {
            addXP(habit.xpReward);
          }
        }
      },

      addGoal: (goal) => {
        const newGoal: Goal = {
          ...goal,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ goals: [...state.goals, newGoal] }));
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        }));
      },

      removeGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }));
      },

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },

      closeWelcomeModal: () => {
        set({ showWelcomeModal: false, isFirstTime: false });
      },

      addXP: (amount) => {
        const { draco } = get();
        let newXP = draco.currentXP + amount;
        let newLevel = draco.level;
        let xpToNext = draco.xpToNextLevel;
        
        while (newXP >= xpToNext) {
          newXP -= xpToNext;
          newLevel++;
          xpToNext = calculateXPForLevel(newLevel);
        }
        
        set({
          draco: {
            level: newLevel,
            currentXP: newXP,
            xpToNextLevel: xpToNext,
            totalXP: draco.totalXP + amount,
          },
        });
      },

      getHabitCheckForDate: (habitId, date) => {
        const { habitChecks } = get();
        return habitChecks.find(
          (hc) => hc.habitId === habitId && hc.date === date
        );
      },

      getDailyProgress: (date) => {
        const { habits, habitChecks } = get();
        if (habits.length === 0) return 0;
        
        const completed = habitChecks.filter(
          (hc) => hc.date === date && hc.completed
        ).length;
        
        return Math.round((completed / habits.length) * 100);
      },

      getWeeklyProgress: (weekStart) => {
        const { habits, habitChecks } = get();
        if (habits.length === 0) return 0;
        
        const start = new Date(weekStart);
        const dates: string[] = [];
        
        for (let i = 0; i < 7; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          dates.push(d.toISOString().split('T')[0]);
        }
        
        const totalPossible = habits.length * 7;
        const completed = habitChecks.filter(
          (hc) => dates.includes(hc.date) && hc.completed
        ).length;
        
        return Math.round((completed / totalPossible) * 100);
      },

      getMonthlyProgress: (year, month) => {
        const { habits, habitChecks } = get();
        if (habits.length === 0) return 0;
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const totalPossible = habits.length * daysInMonth;
        
        const completed = habitChecks.filter((hc) => {
          const date = new Date(hc.date);
          return date.getFullYear() === year && date.getMonth() === month && hc.completed;
        }).length;
        
        return Math.round((completed / totalPossible) * 100);
      },
    }),
    {
      name: 'draco-habits-storage',
    }
  )
);
