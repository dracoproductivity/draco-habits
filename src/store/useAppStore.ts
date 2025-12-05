import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Habit, HabitCheck, Goal, DracoState, AppSettings, TabType, CustomCategory, DailyTracking, DEFAULT_CATEGORIES } from '@/types';

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
  customCategories: CustomCategory[];
  
  // Daily Tracking (sleep/phone)
  dailyTracking: DailyTracking[];
  lastCheckInDate: string | null; // Last date the daily check-in was shown
  
  // Settings
  settings: AppSettings;
  
  // UI
  activeTab: TabType;
  showWelcomeModal: boolean;
  showDailyCheckIn: boolean;
  
  // Actions
  login: (email: string, password: string) => boolean;
  signup: (user: Omit<User, 'id'>, password: string) => boolean;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => Habit;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  removeHabit: (id: string) => void;
  toggleHabitCheck: (habitId: string, date: string) => void;
  
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
  
  addCustomCategory: (category: Omit<CustomCategory, 'id'>) => CustomCategory;
  updateCustomCategory: (id: string, updates: Partial<CustomCategory>) => void;
  removeCustomCategory: (id: string) => void;
  initializeDefaultCategories: () => void;
  
  // Daily tracking
  addDailyTracking: (tracking: DailyTracking) => void;
  getDailyTrackingForDate: (date: string) => DailyTracking | undefined;
  closeDailyCheckIn: () => void;
  checkAndShowDailyCheckIn: () => boolean;
  
  updateSettings: (settings: Partial<AppSettings>) => void;
  setActiveTab: (tab: TabType) => void;
  closeWelcomeModal: () => void;
  
  updateDraco: (updates: Partial<DracoState>) => void;
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
  name: 'Draco',
  color: 'blue',
};

const defaultSettings: AppSettings = {
  themeColor: 'blue',
  progressDisplayMode: 'linear',
  showEmojis: true,
  notificationsEnabled: true,
  notificationReminders: [
    { id: '1', time: '09:00', message: 'Bom dia! 🌞 Hora de começar seus hábitos!', enabled: true },
  ],
  darkMode: true,
  minSleepHours: 7,
  maxPhoneHours: 3,
};

// Empty defaults for first-time users
const defaultHabits: Habit[] = [];

const defaultGoals: Goal[] = [];

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
      customCategories: [],
      dailyTracking: [],
      lastCheckInDate: null,
      settings: defaultSettings,
      activeTab: 'daily',
      showWelcomeModal: false,
      showDailyCheckIn: false,

      login: (email, password) => {
        if (email && password) {
          set({ 
            isAuthenticated: true,
            user: {
              id: '1',
              email,
              firstName: 'Usuário',
              lastName: 'Demo',
              birthDate: '1999-01-01',
              photo: '',
            }
          });
          // Initialize default categories on login
          get().initializeDefaultCategories();
          // Check if should show daily check-in
          get().checkAndShowDailyCheckIn();
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
          // Initialize default categories on signup
          get().initializeDefaultCategories();
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
        return newHabit;
      },

      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        }));
      },

      removeHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          habitChecks: state.habitChecks.filter((hc) => hc.habitId !== id),
        }));
      },

      toggleHabitCheck: (habitId, date) => {
        const { habitChecks, habits, goals, addXP } = get();
        const existing = habitChecks.find(
          (hc) => hc.habitId === habitId && hc.date === date
        );
        
        const habit = habits.find((h) => h.id === habitId);
        
        // Get XP from linked goal's category if exists
        let xpToAdd = habit?.xpReward || 0;
        if (habit?.goalId) {
          const linkedGoal = goals.find(g => g.id === habit.goalId);
          if (linkedGoal?.categoryXP !== undefined) {
            xpToAdd = linkedGoal.categoryXP;
          }
        }
        
        if (existing) {
          set({
            habitChecks: habitChecks.map((hc) =>
              hc.habitId === habitId && hc.date === date
                ? { ...hc, completed: !hc.completed }
                : hc
            ),
          });
          if (!existing.completed && xpToAdd > 0) {
            addXP(xpToAdd);
          }
        } else {
          set({
            habitChecks: [...habitChecks, { habitId, date, completed: true }],
          });
          if (xpToAdd > 0) {
            addXP(xpToAdd);
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
        return newGoal;
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

      initializeDefaultCategories: () => {
        const { customCategories } = get();
        // Only initialize if no categories exist
        if (customCategories.length === 0) {
          const defaultCats: CustomCategory[] = DEFAULT_CATEGORIES.map(cat => ({
            id: cat.id,
            name: cat.name,
            emoji: cat.emoji,
            hasEmoji: true,
            xpReward: 10,
            isDefault: true,
          }));
          set({ customCategories: defaultCats });
        }
      },

      addCustomCategory: (category) => {
        const newCategory: CustomCategory = {
          ...category,
          id: Date.now().toString(),
        };
        set((state) => ({ customCategories: [...state.customCategories, newCategory] }));
        return newCategory;
      },

      updateCustomCategory: (id, updates) => {
        set((state) => ({
          customCategories: state.customCategories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      removeCustomCategory: (id) => {
        set((state) => ({
          customCategories: state.customCategories.filter((c) => c.id !== id),
        }));
      },

      addDailyTracking: (tracking) => {
        set((state) => {
          const existing = state.dailyTracking.findIndex(t => t.date === tracking.date);
          if (existing >= 0) {
            const updated = [...state.dailyTracking];
            updated[existing] = tracking;
            return { dailyTracking: updated };
          }
          return { dailyTracking: [...state.dailyTracking, tracking] };
        });
      },

      getDailyTrackingForDate: (date) => {
        const { dailyTracking } = get();
        return dailyTracking.find(t => t.date === date);
      },

      closeDailyCheckIn: () => {
        const today = new Date().toISOString().split('T')[0];
        set({ showDailyCheckIn: false, lastCheckInDate: today });
      },

      checkAndShowDailyCheckIn: () => {
        const now = new Date();
        const currentHour = now.getHours();
        const today = now.toISOString().split('T')[0];
        const { lastCheckInDate, isAuthenticated } = get();
        
        // Only show after 5am and if not already shown today
        if (isAuthenticated && currentHour >= 5 && lastCheckInDate !== today) {
          set({ showDailyCheckIn: true });
          return true;
        }
        return false;
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

      updateDraco: (updates) => {
        set((state) => ({
          draco: { ...state.draco, ...updates },
        }));
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
            ...draco,
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
      version: 2, // Increment to reset old incompatible data
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        isFirstTime: state.isFirstTime,
        user: state.user,
        draco: state.draco,
        habits: state.habits,
        habitChecks: state.habitChecks,
        goals: state.goals,
        customCategories: state.customCategories,
        dailyTracking: state.dailyTracking,
        lastCheckInDate: state.lastCheckInDate,
        settings: state.settings,
        activeTab: state.activeTab,
      }),
    }
  )
);
