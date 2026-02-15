import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Habit, HabitCheck, Goal, DracoState, AppSettings, TabType, CustomCategory, DailyLog, Note } from '@/types';
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

// Generate a proper UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface AppStore {
  // Auth
  isAuthenticated: boolean;
  isFirstTime: boolean;
  user: User | null;
  
  // Draco
  draco: DracoState;
  levelUpInfo: { newLevel: number } | null; // For level up animation
  
  // Habits
  habits: Habit[];
  habitChecks: HabitCheck[];
  
  // Goals
  goals: Goal[];
  customCategories: CustomCategory[];
  
  // Daily Logs (sleep/phone)
  dailyLogs: DailyLog[];
  
  // Notes
  notes: Note[];
  
  // Settings
  settings: AppSettings;
  
  // UI
  activeTab: TabType;
  showWelcomeModal: boolean;
  
  // Level up modal
  clearLevelUp: () => void;
  
  // Actions
  login: (email: string, password: string) => boolean;
  signup: (user: Omit<User, 'id'>, password: string) => boolean;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => Habit;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  removeHabit: (id: string) => void;
  toggleHabitCheck: (habitId: string, date: string) => void;
  incrementMicroGoal: (habitId: string, date: string) => void;
  
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
  
  addCustomCategory: (category: Omit<CustomCategory, 'id'>, customId?: string) => CustomCategory;
  updateCustomCategory: (id: string, updates: Partial<CustomCategory>) => void;
  removeCustomCategory: (id: string) => void;
  
  addDailyLog: (log: DailyLog) => void;
  getDailyLogs: (startDate: string, endDate: string) => DailyLog[];
  
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  removeNote: (id: string) => void;
  
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
  glassBlur: 20,
  glassOpacity: 65,
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
      levelUpInfo: null,
      habits: defaultHabits,
      habitChecks: [],
      goals: defaultGoals,
      customCategories: [],
      dailyLogs: [],
      notes: [],
      settings: defaultSettings,
      activeTab: 'home',
      showWelcomeModal: false,

      clearLevelUp: () => {
        set({ levelUpInfo: null });
      },

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
          // Use local timezone formatting to avoid UTC one-day shift
          const now = new Date();
          const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
          notes: [],
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
        } else {
          // Initialize user if it doesn't exist (for initial load from cloud)
          set({ 
            user: { 
              id: updates.id || '', 
              email: updates.email || '', 
              firstName: updates.firstName || '', 
              lastName: updates.lastName || '',
              birthDate: updates.birthDate || '',
              photo: updates.photo || '',
              ...updates 
            } as User 
          });
        }
      },

      addHabit: (habit) => {
        const newHabit: Habit = {
          ...habit,
          id: generateUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ habits: [...state.habits, newHabit] }));
        
        // Recalculate goal progress after adding habit
        setTimeout(() => get().recalculateAllGoalProgress(), 0);
        
        return newHabit;
      },

      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;
            
            // Check if schedule-related fields are being changed
            const isScheduleChange = 
              (updates.weekDays !== undefined && JSON.stringify(updates.weekDays) !== JSON.stringify(h.weekDays)) ||
              (updates.repeatFrequency !== undefined && updates.repeatFrequency !== h.repeatFrequency) ||
              (updates.monthWeeks !== undefined && JSON.stringify(updates.monthWeeks) !== JSON.stringify(h.monthWeeks));
            
            if (isScheduleChange) {
              // Save previous schedule before applying changes
              // Only save if we don't already have a scheduleUpdatedAt set (first time)
              // or if we're changing the schedule again
              const now = new Date().toISOString();
              return {
                ...h,
                ...updates,
                scheduleUpdatedAt: now,
                previousWeekDays: h.weekDays,
                previousRepeatFrequency: h.repeatFrequency,
                previousMonthWeeks: h.monthWeeks,
              };
            }
            
            return { ...h, ...updates };
          }),
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
        const { habits } = get();
        const habit = habits.find((h) => h.id === habitId);
        
        // Get XP from habit's own xpReward
        const xpAmount = habit?.xpReward || 0;
        
        // Use callback form to always work with latest state
        set((state) => {
          const existing = state.habitChecks.find(
            (hc) => hc.habitId === habitId && hc.date === date
          );
          
          if (existing) {
            const newCompleted = !existing.completed;
            
            // Calculate new draco state
            let newDraco = { ...state.draco };
            if (newCompleted && xpAmount > 0) {
              let newXP = newDraco.currentXP + xpAmount;
              let newLevel = newDraco.level;
              let xpToNext = newDraco.xpToNextLevel;
              while (newXP >= xpToNext) {
                newXP -= xpToNext;
                newLevel++;
                xpToNext = Math.floor(100 * Math.pow(1.5, newLevel - 1));
              }
              newDraco = {
                ...newDraco,
                level: newLevel,
                currentXP: newXP,
                xpToNextLevel: xpToNext,
                totalXP: newDraco.totalXP + xpAmount,
              };
            } else if (!newCompleted && xpAmount > 0) {
              const newTotalXP = Math.max(0, newDraco.totalXP - xpAmount);
              let level = 1;
              let xpRemaining = newTotalXP;
              let xpForLevel = 100;
              while (xpRemaining >= xpForLevel) {
                xpRemaining -= xpForLevel;
                level++;
                xpForLevel = Math.floor(100 * Math.pow(1.5, level - 1));
              }
              newDraco = {
                ...newDraco,
                level,
                currentXP: xpRemaining,
                xpToNextLevel: xpForLevel,
                totalXP: newTotalXP,
              };
            }
            
            const leveledUp = newDraco.level > state.draco.level;
            
            return {
              habitChecks: state.habitChecks.map((hc) =>
                hc.habitId === habitId && hc.date === date
                  ? { ...hc, completed: newCompleted }
                  : hc
              ),
              draco: newDraco,
              levelUpInfo: leveledUp ? { newLevel: newDraco.level } : state.levelUpInfo,
            };
          } else {
            // New check
            let newDraco = { ...state.draco };
            if (xpAmount > 0) {
              let newXP = newDraco.currentXP + xpAmount;
              let newLevel = newDraco.level;
              let xpToNext = newDraco.xpToNextLevel;
              while (newXP >= xpToNext) {
                newXP -= xpToNext;
                newLevel++;
                xpToNext = Math.floor(100 * Math.pow(1.5, newLevel - 1));
              }
              newDraco = {
                ...newDraco,
                level: newLevel,
                currentXP: newXP,
                xpToNextLevel: xpToNext,
                totalXP: newDraco.totalXP + xpAmount,
              };
            }
            
            const leveledUp = newDraco.level > state.draco.level;
            
            return {
              habitChecks: [...state.habitChecks, { habitId, date, completed: true, microGoalsCompleted: 0 }],
              draco: newDraco,
              levelUpInfo: leveledUp ? { newLevel: newDraco.level } : state.levelUpInfo,
            };
          }
        });
        
        // Recalculate all goal progress after check toggle
        setTimeout(() => get().recalculateAllGoalProgress(), 0);
      },

      incrementMicroGoal: (habitId, date) => {
        const { habits } = get();
        const habit = habits.find((h) => h.id === habitId);
        
        if (!habit || !habit.hasMicroGoals || !habit.microGoalsCount) return;
        
        const microGoalsCount = habit.microGoalsCount;
        const xpPerMicroGoal = Math.floor((habit.xpReward || 0) / microGoalsCount);
        
        // Use callback form to always work with latest state
        set((state) => {
          const existing = state.habitChecks.find(
            (hc) => hc.habitId === habitId && hc.date === date
          );
          
          const currentMicroGoals = existing?.microGoalsCompleted || 0;
          
          if (currentMicroGoals >= microGoalsCount) {
            // Reset to 0 if already complete
            const totalXpToRemove = habit.xpReward || 0;
            let newDraco = { ...state.draco };
            
            if (totalXpToRemove > 0) {
              const newTotalXP = Math.max(0, newDraco.totalXP - totalXpToRemove);
              let level = 1;
              let xpRemaining = newTotalXP;
              let xpForLevel = 100;
              while (xpRemaining >= xpForLevel) {
                xpRemaining -= xpForLevel;
                level++;
                xpForLevel = Math.floor(100 * Math.pow(1.5, level - 1));
              }
              newDraco = { ...newDraco, level, currentXP: xpRemaining, xpToNextLevel: xpForLevel, totalXP: newTotalXP };
            }
            
            return {
              habitChecks: state.habitChecks.map((hc) =>
                hc.habitId === habitId && hc.date === date
                  ? { ...hc, completed: false, microGoalsCompleted: 0 }
                  : hc
              ),
              draco: newDraco,
            };
          } else {
            const newMicroGoals = currentMicroGoals + 1;
            const isNowComplete = newMicroGoals >= microGoalsCount;
            
            let newDraco = { ...state.draco };
            if (xpPerMicroGoal > 0) {
              let newXP = newDraco.currentXP + xpPerMicroGoal;
              let newLevel = newDraco.level;
              let xpToNext = newDraco.xpToNextLevel;
              while (newXP >= xpToNext) {
                newXP -= xpToNext;
                newLevel++;
                xpToNext = Math.floor(100 * Math.pow(1.5, newLevel - 1));
              }
              newDraco = {
                ...newDraco,
                level: newLevel,
                currentXP: newXP,
                xpToNextLevel: xpToNext,
                totalXP: newDraco.totalXP + xpPerMicroGoal,
              };
            }
            
            const leveledUp = newDraco.level > state.draco.level;
            
            if (existing) {
              return {
                habitChecks: state.habitChecks.map((hc) =>
                  hc.habitId === habitId && hc.date === date
                    ? { ...hc, completed: isNowComplete, microGoalsCompleted: newMicroGoals }
                    : hc
                ),
                draco: newDraco,
                levelUpInfo: leveledUp ? { newLevel: newDraco.level } : state.levelUpInfo,
              };
            } else {
              return {
                habitChecks: [...state.habitChecks, { 
                  habitId, date, completed: isNowComplete, microGoalsCompleted: newMicroGoals 
                }],
                draco: newDraco,
                levelUpInfo: leveledUp ? { newLevel: newDraco.level } : state.levelUpInfo,
              };
            }
          }
        });
        
        // Recalculate all goal progress after micro goal toggle
        setTimeout(() => get().recalculateAllGoalProgress(), 0);
      },

      addGoal: (goal) => {
        const { goals } = get();
        
        // Check goal limit
        if (goals.length >= 50) {
          console.warn('Goal limit reached (50 goals)');
          // Still create the goal but log warning - validation should be done in UI
        }
        
        const newGoal: Goal = {
          ...goal,
          id: generateUUID(),
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

      addCustomCategory: (category, customId) => {
        const newCategory: CustomCategory = {
          ...category,
          id: customId || generateUUID(),
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

      addNote: (noteData) => {
        const newNote: Note = {
          ...noteData,
          id: generateUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ notes: [...state.notes, newNote] }));
        return newNote;
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((n) => n.id === id ? { ...n, ...updates } : n),
        }));
      },

      removeNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
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
        // Parse date string as local timezone (not UTC) to avoid one-day shift
        // "YYYY-MM-DD" passed to new Date() is interpreted as UTC, causing issues
        const [year, month, day] = date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        
        // Get habits that should appear on this date
        const habitsForDate = getHabitsForDate(dateObj, habits, goals);
        
        if (habitsForDate.length === 0) return 0;
        
        // Calculate progress considering micro-goals partial completion
        let totalProgress = 0;
        
        for (const habit of habitsForDate) {
          const check = habitChecks.find(
            hc => hc.habitId === habit.id && hc.date === date
          );
          
          if (habit.hasMicroGoals && habit.microGoalsCount && habit.microGoalsCount > 1) {
            // For micro-goals habits, calculate partial progress
            const microGoalsCompleted = check?.microGoalsCompleted || 0;
            totalProgress += microGoalsCompleted / habit.microGoalsCount;
          } else {
            // For regular habits, it's 0 or 1
            totalProgress += check?.completed ? 1 : 0;
          }
        }
        
        return Math.round((totalProgress / habitsForDate.length) * 100);
      },

      getWeeklyProgress: (weekStart) => {
        const { habits, habitChecks, goals } = get();
        
        // Parse weekStart as local timezone to avoid UTC shift
        const [startYear, startMonth, startDay] = weekStart.split('-').map(Number);
        const start = new Date(startYear, startMonth - 1, startDay);
        const dates: string[] = [];
        
        for (let i = 0; i < 7; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          // Use local timezone formatting to avoid UTC one-day shift
          dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        }
        
        let totalScheduled = 0;
        let totalCompleted = 0;
        
        for (const dateStr of dates) {
          // Parse each date as local timezone
          const [y, m, d] = dateStr.split('-').map(Number);
          const dateObj = new Date(y, m - 1, d);
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
          // Use local timezone formatting to avoid UTC one-day shift
          const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
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
