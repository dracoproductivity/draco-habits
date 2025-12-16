import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Habit, HabitCheck, Goal, DracoState, AppSettings, TabType, CustomCategory, DailyLog } from '@/types';
import {
  calculateHabitProgress,
  calculateGoalProgress,
  calculateAllPeriodProgress,
  getHabitsForDate,
  isHabitScheduledForDate,
  calculateTotalOccurrences,
  getPeriodBoundaries,
  PeriodProgress
} from '@/utils/habitInstanceCalculator';

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
  
  // Daily Logs (sleep/phone)
  dailyLogs: DailyLog[];
  
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
  
  addDailyLog: (log: DailyLog) => void;
  getDailyLogs: (startDate: string, endDate: string) => DailyLog[];
  
  updateSettings: (settings: Partial<AppSettings>) => void;
  setActiveTab: (tab: TabType) => void;
  closeWelcomeModal: () => void;
  
  updateDraco: (updates: Partial<DracoState>) => void;
  addXP: (amount: number) => void;
  
  getHabitCheckForDate: (habitId: string, date: string) => HabitCheck | undefined;
  getDailyProgress: (date: string) => number;
  getWeeklyProgress: (weekStart: string) => number;
  getMonthlyProgress: (year: number, month: number) => number;
  
  // New progress calculation methods
  getHabitProgress: (habitId: string) => { completed: number; total: number; percentage: number };
  getGoalProgress: (goalId: string) => number;
  getAllPeriodProgress: () => Map<string, PeriodProgress>;
  getHabitsForDate: (date: Date) => Habit[];
  recalculateAllGoalProgress: () => void;
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
  maxPhoneHours: 2,
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
      dailyLogs: [],
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
              birthDate: '1999-01-01',
              photo: '',
            }
          });
          return true;
        }
        return false;
      },

      signup: (userData, password) => {
        if (userData.email && password) {
          const today = new Date().toISOString().split('T')[0];
          set((state) => ({ 
            isAuthenticated: true,
            isFirstTime: true,
            showWelcomeModal: true,
            user: {
              ...userData,
              id: Date.now().toString(),
            },
            settings: {
              ...state.settings,
              accountCreatedAt: today,
            }
          }));
          return true;
        }
        return false;
      },

      logout: () => {
        // Clear all user data on logout to prevent data mixing between users
        set({ 
          isAuthenticated: false, 
          user: null,
          isFirstTime: true,
          habits: [],
          habitChecks: [],
          goals: [],
          customCategories: [],
          dailyLogs: [],
          draco: defaultDraco,
          settings: defaultSettings,
          showWelcomeModal: false,
        });
        
        // Also clear the persisted storage to ensure clean slate
        localStorage.removeItem('draco-habits-storage');
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
        
        // Recalculate goal progress after adding habit
        setTimeout(() => get().recalculateAllGoalProgress(), 0);
        
        return newHabit;
      },

      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        }));
        
        // Recalculate goal progress after updating habit
        setTimeout(() => get().recalculateAllGoalProgress(), 0);
      },

      removeHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          habitChecks: state.habitChecks.filter((hc) => hc.habitId !== id),
        }));
        
        // Recalculate goal progress after removing habit
        setTimeout(() => get().recalculateAllGoalProgress(), 0);
      },

      toggleHabitCheck: (habitId, date) => {
        const { habitChecks, habits, goals, draco } = get();
        const existing = habitChecks.find(
          (hc) => hc.habitId === habitId && hc.date === date
        );
        
        const habit = habits.find((h) => h.id === habitId);
        
        // Get XP from linked goal's category if exists
        let xpAmount = habit?.xpReward || 0;
        if (habit?.goalId) {
          const linkedGoal = goals.find(g => g.id === habit.goalId);
          if (linkedGoal?.categoryXP !== undefined) {
            xpAmount = linkedGoal.categoryXP;
          }
        }
        
        if (existing) {
          const wasCompleted = existing.completed;
          const newCompleted = !wasCompleted;
          
          // Update completion status
          set({
            habitChecks: habitChecks.map((hc) =>
              hc.habitId === habitId && hc.date === date
                ? { ...hc, completed: newCompleted }
                : hc
            ),
          });
          
          // Add XP when marking complete, remove XP when unmarking
          if (newCompleted && xpAmount > 0) {
            // Adding XP
            set((state) => {
              let newXP = state.draco.currentXP + xpAmount;
              let newLevel = state.draco.level;
              let xpToNext = state.draco.xpToNextLevel;
              
              while (newXP >= xpToNext) {
                newXP -= xpToNext;
                newLevel++;
                xpToNext = Math.floor(100 * Math.pow(1.5, newLevel - 1));
              }
              
              return {
                draco: {
                  ...state.draco,
                  level: newLevel,
                  currentXP: newXP,
                  xpToNextLevel: xpToNext,
                  totalXP: state.draco.totalXP + xpAmount,
                },
              };
            });
          } else if (!newCompleted && xpAmount > 0) {
            // Removing XP
            set((state) => {
              let newTotalXP = Math.max(0, state.draco.totalXP - xpAmount);
              
              // Recalculate level from total XP
              let level = 1;
              let xpRemaining = newTotalXP;
              let xpForLevel = 100;
              
              while (xpRemaining >= xpForLevel) {
                xpRemaining -= xpForLevel;
                level++;
                xpForLevel = Math.floor(100 * Math.pow(1.5, level - 1));
              }
              
              return {
                draco: {
                  ...state.draco,
                  level: level,
                  currentXP: xpRemaining,
                  xpToNextLevel: xpForLevel,
                  totalXP: newTotalXP,
                },
              };
            });
          }
        } else {
          set({
            habitChecks: [...habitChecks, { habitId, date, completed: true }],
          });
          if (xpAmount > 0) {
            set((state) => {
              let newXP = state.draco.currentXP + xpAmount;
              let newLevel = state.draco.level;
              let xpToNext = state.draco.xpToNextLevel;
              
              while (newXP >= xpToNext) {
                newXP -= xpToNext;
                newLevel++;
                xpToNext = Math.floor(100 * Math.pow(1.5, newLevel - 1));
              }
              
              return {
                draco: {
                  ...state.draco,
                  level: newLevel,
                  currentXP: newXP,
                  xpToNextLevel: xpToNext,
                  totalXP: state.draco.totalXP + xpAmount,
                },
              };
            });
          }
        }
        
        // Recalculate all goal progress after check toggle
        setTimeout(() => get().recalculateAllGoalProgress(), 0);
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

      addDailyLog: (log) => {
        set((state) => {
          const existingIndex = state.dailyLogs.findIndex((l) => l.date === log.date);
          if (existingIndex >= 0) {
            const newLogs = [...state.dailyLogs];
            newLogs[existingIndex] = log;
            return { dailyLogs: newLogs };
          }
          return { dailyLogs: [...state.dailyLogs, log] };
        });
      },

      getDailyLogs: (startDate, endDate) => {
        const { dailyLogs } = get();
        return dailyLogs.filter((log) => log.date >= startDate && log.date <= endDate);
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

      // New progress calculation method for habits (X/N)
      getHabitProgress: (habitId) => {
        const { habits, goals, habitChecks } = get();
        const habit = habits.find(h => h.id === habitId);
        
        if (!habit) {
          return { completed: 0, total: 0, percentage: 0 };
        }
        
        const linkedGoal = habit.goalId ? goals.find(g => g.id === habit.goalId) : null;
        return calculateHabitProgress(habit, linkedGoal, habitChecks);
      },

      // Get goal progress using the new calculation
      getGoalProgress: (goalId) => {
        const { goals, habits, habitChecks } = get();
        const goal = goals.find(g => g.id === goalId);
        
        if (!goal) return 0;
        
        return calculateGoalProgress(goal, habits, habitChecks);
      },

      // Get all period progress (including phantom goals)
      getAllPeriodProgress: () => {
        const { habits, goals, habitChecks } = get();
        return calculateAllPeriodProgress(habits, goals, habitChecks);
      },

      // Get habits that should appear on a specific date
      getHabitsForDate: (date: Date) => {
        const { habits, goals } = get();
        return getHabitsForDate(date, habits, goals);
      },

      // Recalculate all goal progress
      recalculateAllGoalProgress: () => {
        const { goals, habits, habitChecks } = get();
        
        const updatedGoals = goals.map(goal => {
          const progress = calculateGoalProgress(goal, habits, habitChecks);
          return { ...goal, progress };
        });
        
        set({ goals: updatedGoals });
      },

      getDailyProgress: (date) => {
        const { habits, habitChecks, goals } = get();
        const dateObj = new Date(date);
        
        // Get habits that should appear on this date
        const habitsForDate = getHabitsForDate(dateObj, habits, goals);
        
        if (habitsForDate.length === 0) return 0;
        
        const completed = habitsForDate.filter(habit => {
          const check = habitChecks.find(
            hc => hc.habitId === habit.id && hc.date === date && hc.completed
          );
          return check !== undefined;
        }).length;
        
        return Math.round((completed / habitsForDate.length) * 100);
      },

      getWeeklyProgress: (weekStart) => {
        const { habits, habitChecks, goals } = get();
        
        const start = new Date(weekStart);
        const dates: string[] = [];
        
        for (let i = 0; i < 7; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          dates.push(d.toISOString().split('T')[0]);
        }
        
        let totalScheduled = 0;
        let totalCompleted = 0;
        
        for (const dateStr of dates) {
          const dateObj = new Date(dateStr);
          const habitsForDate = getHabitsForDate(dateObj, habits, goals);
          totalScheduled += habitsForDate.length;
          
          const completedOnDate = habitsForDate.filter(habit => {
            const check = habitChecks.find(
              hc => hc.habitId === habit.id && hc.date === dateStr && hc.completed
            );
            return check !== undefined;
          }).length;
          
          totalCompleted += completedOnDate;
        }
        
        if (totalScheduled === 0) return 0;
        return Math.round((totalCompleted / totalScheduled) * 100);
      },

      getMonthlyProgress: (year, month) => {
        const { habits, habitChecks, goals } = get();
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let totalScheduled = 0;
        let totalCompleted = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
          const dateObj = new Date(year, month, day);
          const dateStr = dateObj.toISOString().split('T')[0];
          const habitsForDate = getHabitsForDate(dateObj, habits, goals);
          totalScheduled += habitsForDate.length;
          
          const completedOnDate = habitsForDate.filter(habit => {
            const check = habitChecks.find(
              hc => hc.habitId === habit.id && hc.date === dateStr && hc.completed
            );
            return check !== undefined;
          }).length;
          
          totalCompleted += completedOnDate;
        }
        
        if (totalScheduled === 0) return 0;
        return Math.round((totalCompleted / totalScheduled) * 100);
      },
    }),
    {
      name: 'draco-habits-storage',
    }
  )
);
