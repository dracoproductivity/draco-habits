import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/hooks/use-toast';
import type { Habit, Goal, HabitCheck, DailyLog, AppSettings, DracoState, CustomCategory, User } from '@/types';

// Type definitions for database rows
interface ProfileRow {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  photo: string | null;
}

interface DracoRow {
  user_id: string;
  level: number;
  current_xp: number;
  xp_to_next_level: number;
  total_xp: number;
  name: string;
  color: string;
}

interface SettingsRow {
  user_id: string;
  theme_color: string;
  progress_display_mode: string;
  show_emojis: boolean;
  notifications_enabled: boolean;
  notification_reminders: unknown;
  dark_mode: boolean;
  min_sleep_hours: number | null;
  max_phone_hours: number | null;
  account_created_at: string | null;
  last_daily_log_date: string | null;
}

interface GoalRow {
  id: string;
  user_id: string;
  name: string;
  emoji: string | null;
  type: string;
  progress: number;
  period_value: string | null;
  parent_goal_id: string | null;
  category: string | null;
  category_xp: number | null;
  created_at: string;
}

interface HabitRow {
  id: string;
  user_id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  goal_id: string | null;
  period_type: string;
  period_value: string | null;
  selected_days: number[] | null;
  repeat_weekly: boolean;
  frequency_weeks: number;
  specific_weeks_of_month: number[] | null;
  xp_reward: number | null;
  notification_enabled: boolean;
  notification_time: string | null;
  created_at: string;
}

interface HabitCheckRow {
  id: string;
  user_id: string;
  habit_id: string;
  date: string;
  completed: boolean;
}

interface DailyLogRow {
  id: string;
  user_id: string;
  date: string;
  sleep_hours: number | null;
  phone_usage_hours: number | null;
}

interface CustomCategoryRow {
  id: string;
  user_id: string;
  name: string;
  emoji: string | null;
  show_emoji: boolean;
  xp_reward: number;
}

export const useCloudSync = () => {
  const { user, isAuthenticated } = useAuth();
  const store = useAppStore();
  const syncInProgress = useRef(false);
  const lastSyncTime = useRef<number>(0);
  const isInitialLoad = useRef(true);
  const lastSyncedData = useRef<{
    habits: string;
    goals: string;
    habitChecks: string;
    customCategories: string;
    draco: string;
  }>({
    habits: '',
    goals: '',
    habitChecks: '',
    customCategories: '',
    draco: '',
  });
  
  // Load all data from cloud
  const loadFromCloud = useCallback(async () => {
    if (!user || syncInProgress.current) return;
    
    syncInProgress.current = true;
    isInitialLoad.current = true;
    
    // Clear existing data first to prevent data from other users mixing
    useAppStore.setState({
      habits: [],
      habitChecks: [],
      goals: [],
      customCategories: [],
      dailyLogs: [],
    });
    
    try {
      // Load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profile) {
        const profileData = profile as ProfileRow;
        store.updateUser({
          id: user.id,
          email: user.email || '',
          firstName: profileData.first_name || 'Usuário',
          lastName: profileData.last_name || '',
          birthDate: profileData.birth_date || undefined,
          photo: profileData.photo || '',
        });
      }
      
      // Load draco state
      const { data: dracoData } = await supabase
        .from('draco_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (dracoData) {
        const draco = dracoData as DracoRow;
        store.updateDraco({
          level: draco.level,
          currentXP: draco.current_xp,
          xpToNextLevel: draco.xp_to_next_level,
          totalXP: draco.total_xp,
          name: draco.name,
          color: draco.color as DracoState['color'],
        });
      }
      
      // Load settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (settingsData) {
        const settings = settingsData as SettingsRow;
        
        // Parse notification_reminders - it may come as a string from the database
        let notificationReminders: AppSettings['notificationReminders'] = [];
        if (settings.notification_reminders) {
          if (typeof settings.notification_reminders === 'string') {
            try {
              notificationReminders = JSON.parse(settings.notification_reminders);
            } catch {
              notificationReminders = [];
            }
          } else if (Array.isArray(settings.notification_reminders)) {
            notificationReminders = settings.notification_reminders as AppSettings['notificationReminders'];
          }
        }
        
        store.updateSettings({
          themeColor: settings.theme_color as AppSettings['themeColor'],
          progressDisplayMode: settings.progress_display_mode as AppSettings['progressDisplayMode'],
          showEmojis: settings.show_emojis,
          notificationsEnabled: settings.notifications_enabled,
          notificationReminders,
          darkMode: settings.dark_mode,
          minSleepHours: settings.min_sleep_hours || 7,
          maxPhoneHours: settings.max_phone_hours || 2,
          accountCreatedAt: settings.account_created_at || undefined,
          lastDailyLogDate: settings.last_daily_log_date || undefined,
        });
      }
      
      // Load goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);
      
      const goals: Goal[] = (goalsData as GoalRow[] || []).map((g) => ({
        id: g.id,
        name: g.name,
        emoji: g.emoji || undefined,
        type: g.type as Goal['type'],
        period: g.period_value || '',
        progress: g.progress,
        parentGoalId: g.parent_goal_id || undefined,
        category: g.category as Goal['category'],
        categoryXP: g.category_xp || undefined,
        createdAt: g.created_at,
      }));
      
      useAppStore.setState({ goals });
      
      // Load habits
      const { data: habitsData } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);
      
      const habits: Habit[] = (habitsData as HabitRow[] || []).map((h) => ({
        id: h.id,
        name: h.name,
        emoji: h.emoji || undefined,
        xpReward: h.xp_reward || 10,
        goalId: h.goal_id || undefined,
        notificationEnabled: h.notification_enabled,
        notificationTime: h.notification_time || undefined,
        weekDays: h.selected_days || undefined,
        isOneTime: !h.repeat_weekly,
        repeatFrequency: h.frequency_weeks as Habit['repeatFrequency'],
        monthWeeks: h.specific_weeks_of_month || undefined,
        createdAt: h.created_at,
      }));
      
      useAppStore.setState({ habits });
      
      // Load habit checks
      const { data: checksData } = await supabase
        .from('habit_checks')
        .select('*')
        .eq('user_id', user.id);
      
      const habitChecks: HabitCheck[] = (checksData as HabitCheckRow[] || []).map((c) => ({
        habitId: c.habit_id,
        date: c.date,
        completed: c.completed,
      }));
      
      useAppStore.setState({ habitChecks });
      
      // Load daily logs
      const { data: logsData } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id);
      
      const dailyLogs: DailyLog[] = (logsData as DailyLogRow[] || []).map((l) => ({
        date: l.date,
        sleepHours: l.sleep_hours || 0,
        phoneUsageHours: l.phone_usage_hours || 0,
      }));
      
      useAppStore.setState({ dailyLogs });
      
      // Load custom categories
      const { data: categoriesData } = await supabase
        .from('custom_categories')
        .select('*')
        .eq('user_id', user.id);
      
      const customCategories: CustomCategory[] = (categoriesData as CustomCategoryRow[] || []).map((c) => ({
        id: c.id,
        name: c.name,
        emoji: c.emoji || undefined,
        xpReward: c.xp_reward,
      }));
      
      useAppStore.setState({ customCategories });
      
      // Update last synced data to prevent immediate re-sync
      lastSyncedData.current = {
        habits: JSON.stringify(habits),
        goals: JSON.stringify(goals),
        habitChecks: JSON.stringify(habitChecks),
        customCategories: JSON.stringify(customCategories),
        draco: JSON.stringify(dracoData),
      };
      
      lastSyncTime.current = Date.now();
    } catch (error) {
      console.error('Error loading from cloud:', error);
    } finally {
      syncInProgress.current = false;
      // Mark initial load as complete after a short delay
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 1000);
    }
  }, [user, store]);
  
  // Save profile to cloud
  const saveProfile = useCallback(async (profileData: Partial<User>) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        birth_date: profileData.birthDate,
        photo: profileData.photo,
      })
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error saving profile:', error);
      toast({ title: 'Erro ao salvar perfil', variant: 'destructive' });
    }
  }, [user]);
  
  // Save draco state to cloud
  const saveDraco = useCallback(async (dracoData: Partial<DracoState>) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('draco_state')
      .update({
        level: dracoData.level,
        current_xp: dracoData.currentXP,
        xp_to_next_level: dracoData.xpToNextLevel,
        total_xp: dracoData.totalXP,
        name: dracoData.name,
        color: dracoData.color,
      })
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error saving draco:', error);
    }
  }, [user]);
  
  // Save settings to cloud
  const saveSettings = useCallback(async (settingsData: Partial<AppSettings>) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('user_settings')
      .update({
        theme_color: settingsData.themeColor,
        progress_display_mode: settingsData.progressDisplayMode,
        show_emojis: settingsData.showEmojis,
        notifications_enabled: settingsData.notificationsEnabled,
        notification_reminders: JSON.stringify(settingsData.notificationReminders),
        dark_mode: settingsData.darkMode,
        min_sleep_hours: settingsData.minSleepHours,
        max_phone_hours: settingsData.maxPhoneHours,
        last_daily_log_date: settingsData.lastDailyLogDate,
      })
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error saving settings:', error);
    }
  }, [user]);
  
  // Save goal to cloud
  const saveGoal = useCallback(async (goal: Goal) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('goals')
      .upsert({
        id: goal.id,
        user_id: user.id,
        name: goal.name,
        emoji: goal.emoji,
        type: goal.type,
        progress: goal.progress,
        period_value: goal.period,
        parent_goal_id: goal.parentGoalId,
        category: goal.category,
        category_xp: goal.categoryXP,
      });
    
    if (error) {
      console.error('Error saving goal:', error);
    }
  }, [user]);
  
  // Delete goal from cloud
  const deleteGoal = useCallback(async (goalId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error deleting goal:', error);
    }
  }, [user]);
  
  // Save habit to cloud
  const saveHabit = useCallback(async (habit: Habit) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('habits')
      .upsert({
        id: habit.id,
        user_id: user.id,
        name: habit.name,
        emoji: habit.emoji,
        goal_id: habit.goalId,
        period_type: 'weekly', // Default, can be customized
        selected_days: habit.weekDays,
        repeat_weekly: !habit.isOneTime,
        frequency_weeks: habit.repeatFrequency || 1,
        specific_weeks_of_month: habit.monthWeeks,
        xp_reward: habit.xpReward,
        notification_enabled: habit.notificationEnabled || false,
        notification_time: habit.notificationTime,
      });
    
    if (error) {
      console.error('Error saving habit:', error);
    }
  }, [user]);
  
  // Delete habit from cloud
  const deleteHabit = useCallback(async (habitId: string) => {
    if (!user) return;
    
    // First delete habit checks for this habit
    await supabase
      .from('habit_checks')
      .delete()
      .eq('habit_id', habitId)
      .eq('user_id', user.id);
    
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error deleting habit:', error);
    }
  }, [user]);
  
  // Save habit check to cloud
  const saveHabitCheck = useCallback(async (habitId: string, date: string, completed: boolean) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('habit_checks')
      .upsert({
        user_id: user.id,
        habit_id: habitId,
        date: date,
        completed: completed,
      }, {
        onConflict: 'habit_id,date',
      });
    
    if (error) {
      console.error('Error saving habit check:', error);
    }
  }, [user]);
  
  // Save daily log to cloud
  const saveDailyLog = useCallback(async (log: DailyLog) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('daily_logs')
      .upsert({
        user_id: user.id,
        date: log.date,
        sleep_hours: log.sleepHours,
        phone_usage_hours: log.phoneUsageHours,
      }, {
        onConflict: 'user_id,date',
      });
    
    if (error) {
      console.error('Error saving daily log:', error);
    }
  }, [user]);
  
  // Save custom category to cloud
  const saveCustomCategory = useCallback(async (category: CustomCategory) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('custom_categories')
      .upsert({
        id: category.id,
        user_id: user.id,
        name: category.name,
        emoji: category.emoji,
        xp_reward: category.xpReward,
      });
    
    if (error) {
      console.error('Error saving category:', error);
    }
  }, [user]);
  
  // Delete custom category from cloud
  const deleteCustomCategory = useCallback(async (categoryId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('custom_categories')
      .delete()
      .eq('id', categoryId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error deleting category:', error);
    }
  }, [user]);
  
  // Initial load when authenticated - track user ID to detect user changes
  const lastLoadedUserId = useRef<string | null>(null);
  
  useEffect(() => {
    if (isAuthenticated && user) {
      // If user changed, force reload
      if (lastLoadedUserId.current !== user.id) {
        lastLoadedUserId.current = user.id;
        syncInProgress.current = false; // Reset sync flag for new user
        loadFromCloud();
      }
    } else {
      lastLoadedUserId.current = null;
    }
  }, [isAuthenticated, user, loadFromCloud]);
  
  // Auto-sync habits when they change
  useEffect(() => {
    if (!user || isInitialLoad.current) return;
    
    const currentHabits = useAppStore.getState().habits;
    const currentHabitsStr = JSON.stringify(currentHabits);
    
    if (currentHabitsStr !== lastSyncedData.current.habits) {
      // Find new or updated habits
      const previousHabits: Habit[] = lastSyncedData.current.habits ? JSON.parse(lastSyncedData.current.habits) : [];
      const previousIds = new Set(previousHabits.map(h => h.id));
      const currentIds = new Set(currentHabits.map(h => h.id));
      
      // Save new and updated habits
      currentHabits.forEach(habit => {
        const prev = previousHabits.find(h => h.id === habit.id);
        if (!prev || JSON.stringify(prev) !== JSON.stringify(habit)) {
          saveHabit(habit);
        }
      });
      
      // Delete removed habits
      previousHabits.forEach(habit => {
        if (!currentIds.has(habit.id)) {
          deleteHabit(habit.id);
        }
      });
      
      lastSyncedData.current.habits = currentHabitsStr;
    }
  }, [useAppStore.getState().habits, user, saveHabit, deleteHabit]);
  
  // Auto-sync goals when they change
  useEffect(() => {
    if (!user || isInitialLoad.current) return;
    
    const currentGoals = useAppStore.getState().goals;
    const currentGoalsStr = JSON.stringify(currentGoals);
    
    if (currentGoalsStr !== lastSyncedData.current.goals) {
      // Find new or updated goals
      const previousGoals: Goal[] = lastSyncedData.current.goals ? JSON.parse(lastSyncedData.current.goals) : [];
      const currentIds = new Set(currentGoals.map(g => g.id));
      
      // Save new and updated goals
      currentGoals.forEach(goal => {
        const prev = previousGoals.find(g => g.id === goal.id);
        if (!prev || JSON.stringify(prev) !== JSON.stringify(goal)) {
          saveGoal(goal);
        }
      });
      
      // Delete removed goals
      previousGoals.forEach(goal => {
        if (!currentIds.has(goal.id)) {
          deleteGoal(goal.id);
        }
      });
      
      lastSyncedData.current.goals = currentGoalsStr;
    }
  }, [useAppStore.getState().goals, user, saveGoal, deleteGoal]);
  
  // Auto-sync habit checks when they change
  useEffect(() => {
    if (!user || isInitialLoad.current) return;
    
    const currentChecks = useAppStore.getState().habitChecks;
    const currentChecksStr = JSON.stringify(currentChecks);
    
    if (currentChecksStr !== lastSyncedData.current.habitChecks) {
      const previousChecks: HabitCheck[] = lastSyncedData.current.habitChecks ? JSON.parse(lastSyncedData.current.habitChecks) : [];
      
      // Save new and updated checks
      currentChecks.forEach(check => {
        const prev = previousChecks.find(c => c.habitId === check.habitId && c.date === check.date);
        if (!prev || prev.completed !== check.completed) {
          saveHabitCheck(check.habitId, check.date, check.completed);
        }
      });
      
      lastSyncedData.current.habitChecks = currentChecksStr;
    }
  }, [useAppStore.getState().habitChecks, user, saveHabitCheck]);
  
  // Auto-sync custom categories when they change
  useEffect(() => {
    if (!user || isInitialLoad.current) return;
    
    const currentCategories = useAppStore.getState().customCategories;
    const currentCategoriesStr = JSON.stringify(currentCategories);
    
    if (currentCategoriesStr !== lastSyncedData.current.customCategories) {
      const previousCategories: CustomCategory[] = lastSyncedData.current.customCategories ? JSON.parse(lastSyncedData.current.customCategories) : [];
      const currentIds = new Set(currentCategories.map(c => c.id));
      
      // Save new and updated categories
      currentCategories.forEach(category => {
        const prev = previousCategories.find(c => c.id === category.id);
        if (!prev || JSON.stringify(prev) !== JSON.stringify(category)) {
          saveCustomCategory(category);
        }
      });
      
      // Delete removed categories
      previousCategories.forEach(category => {
        if (!currentIds.has(category.id)) {
          deleteCustomCategory(category.id);
        }
      });
      
      lastSyncedData.current.customCategories = currentCategoriesStr;
    }
  }, [useAppStore.getState().customCategories, user, saveCustomCategory, deleteCustomCategory]);
  
  // Auto-sync draco when it changes
  useEffect(() => {
    if (!user || isInitialLoad.current) return;
    
    const currentDraco = useAppStore.getState().draco;
    const currentDracoStr = JSON.stringify(currentDraco);
    
    if (currentDracoStr !== lastSyncedData.current.draco) {
      saveDraco(currentDraco);
      lastSyncedData.current.draco = currentDracoStr;
    }
  }, [useAppStore.getState().draco, user, saveDraco]);
  
  return {
    loadFromCloud,
    saveProfile,
    saveDraco,
    saveSettings,
    saveGoal,
    deleteGoal,
    saveHabit,
    deleteHabit,
    saveHabitCheck,
    saveDailyLog,
    saveCustomCategory,
    deleteCustomCategory,
  };
};
