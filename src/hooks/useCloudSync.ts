import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/hooks/use-toast';
import type { Habit, Goal, HabitCheck, DailyLog, AppSettings, DracoState, CustomCategory, User } from '@/types';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUUID = (id: string): boolean => {
  return UUID_REGEX.test(id);
};

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
  custom_category_id: string | null;
  completion_status: string | null;
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
  start_date: string | null;
  end_date: string | null;
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

// Global refs to persist across hook instances
const globalState = {
  syncInProgress: false,
  isInitialLoad: true,
  lastLoadedUserId: null as string | null,
  lastSyncedData: {
    habits: '',
    goals: '',
    habitChecks: '',
    customCategories: '',
    draco: '',
    user: '',
    settings: '',
  },
};

export const useCloudSync = () => {
  const { user, isAuthenticated } = useAuth();
  const userIdRef = useRef<string | null>(null);
  
  // Update userIdRef when user changes
  useEffect(() => {
    userIdRef.current = user?.id || null;
  }, [user?.id]);
  
  // Load all data from cloud
  const loadFromCloud = useCallback(async (userId: string) => {
    if (globalState.syncInProgress) return;
    
    globalState.syncInProgress = true;
    globalState.isInitialLoad = true;
    
    try {
      // Get current auth session for email
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email || '';
      
      // Load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profile) {
        const profileData = profile as ProfileRow;
        useAppStore.getState().updateUser({
          id: userId,
          email: userEmail,
          firstName: profileData.first_name || 'Usuário',
          lastName: profileData.last_name || '',
          birthDate: profileData.birth_date || undefined,
          photo: profileData.photo || '',
        });
      } else {
        // Create initial user state if no profile exists yet
        useAppStore.getState().updateUser({
          id: userId,
          email: userEmail,
          firstName: 'Usuário',
          lastName: '',
          photo: '',
        });
      }
      
      // Load draco state
      const { data: dracoData } = await supabase
        .from('draco_state')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (dracoData) {
        const draco = dracoData as DracoRow;
        useAppStore.getState().updateDraco({
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
        .eq('user_id', userId)
        .maybeSingle();
      
      if (settingsData) {
        const settings = settingsData as SettingsRow;
        
        // Parse notification_reminders
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
        
        useAppStore.getState().updateSettings({
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
        .eq('user_id', userId);
      
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
        customCategoryId: g.custom_category_id || undefined,
        completionStatus: g.completion_status as Goal['completionStatus'],
        createdAt: g.created_at,
      }));
      
      // Load habits
      const { data: habitsData } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId);
      
      const habits: Habit[] = (habitsData as HabitRow[] || []).map((h: any) => ({
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
        startDate: h.start_date || undefined,
        endDate: h.end_date || undefined,
        hasMicroGoals: h.has_micro_goals || false,
        microGoalsCount: h.micro_goals_count || 1,
        microGoalsNames: h.micro_goals_names || undefined,
        createdAt: h.created_at,
      }));
      
      // Load habit checks
      const { data: checksData } = await supabase
        .from('habit_checks')
        .select('*')
        .eq('user_id', userId);
      
      const habitChecks: HabitCheck[] = (checksData as any[] || []).map((c: any) => ({
        habitId: c.habit_id,
        date: c.date,
        completed: c.completed,
        microGoalsCompleted: c.micro_goals_completed || 0,
      }));
      
      // Load daily logs
      const { data: logsData } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId);
      
      const dailyLogs: DailyLog[] = (logsData as DailyLogRow[] || []).map((l) => ({
        date: l.date,
        sleepHours: l.sleep_hours || 0,
        phoneUsageHours: l.phone_usage_hours || 0,
      }));
      
      // Load custom categories
      const { data: categoriesData } = await supabase
        .from('custom_categories')
        .select('*')
        .eq('user_id', userId);
      
      const customCategories: CustomCategory[] = (categoriesData as CustomCategoryRow[] || []).map((c) => ({
        id: c.id,
        name: c.name,
        emoji: c.emoji || undefined,
        xpReward: c.xp_reward,
      }));
      
      // Set all data at once
      useAppStore.setState({
        habits,
        goals,
        habitChecks,
        dailyLogs,
        customCategories,
      });
      
      // Update last synced data to prevent immediate re-sync
      globalState.lastSyncedData = {
        habits: JSON.stringify(habits),
        goals: JSON.stringify(goals),
        habitChecks: JSON.stringify(habitChecks),
        customCategories: JSON.stringify(customCategories),
        draco: JSON.stringify(dracoData),
        user: JSON.stringify(profile),
        settings: JSON.stringify(settingsData),
      };
      
    } catch (error) {
      console.error('Error loading from cloud:', error);
    } finally {
      globalState.syncInProgress = false;
      // Mark initial load as complete after a short delay
      setTimeout(() => {
        globalState.isInitialLoad = false;
      }, 500);
    }
  }, []);
  
  // Save profile to cloud
  const saveProfile = useCallback(async (profileData: Partial<User>) => {
    const userId = userIdRef.current || user?.id;
    if (!userId) {
      console.warn('saveProfile: No user ID available');
      return;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        birth_date: profileData.birthDate,
        photo: profileData.photo,
      })
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error saving profile:', error);
      toast({ title: 'Erro ao salvar perfil', variant: 'destructive' });
    }
  }, [user?.id]);
  
  // Save draco state to cloud
  const saveDraco = useCallback(async (dracoData: Partial<DracoState>) => {
    const userId = userIdRef.current || user?.id;
    if (!userId) {
      console.warn('saveDraco: No user ID available');
      return;
    }
    
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
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error saving draco:', error);
    }
  }, [user?.id]);
  
  // Save settings to cloud
  const saveSettings = useCallback(async (settingsData: Partial<AppSettings>) => {
    // Try ref first, then fall back to user?.id from auth
    const userId = userIdRef.current || user?.id;
    if (!userId) {
      console.warn('saveSettings: No user ID available');
      return;
    }
    
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
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error saving settings:', error);
    }
  }, [user?.id]);
  
  // Save goal to cloud
  const saveGoal = useCallback(async (goal: Goal) => {
    const userId = userIdRef.current || user?.id;
    if (!userId) {
      console.warn('saveGoal: No user ID available');
      return;
    }
    
    // Skip if ID is not a valid UUID
    if (!isValidUUID(goal.id)) {
      console.warn('Skipping goal with invalid UUID:', goal.id);
      return;
    }
    
    const { error } = await supabase
      .from('goals')
      .upsert({
        id: goal.id,
        user_id: userId,
        name: goal.name,
        emoji: goal.emoji,
        type: goal.type,
        progress: goal.progress,
        period_value: goal.period,
        parent_goal_id: goal.parentGoalId && isValidUUID(goal.parentGoalId) ? goal.parentGoalId : null,
        category: goal.category,
        category_xp: goal.categoryXP,
        custom_category_id: goal.customCategoryId && isValidUUID(goal.customCategoryId) ? goal.customCategoryId : null,
        completion_status: goal.completionStatus,
      });
    
    if (error) {
      console.error('Error saving goal:', error);
    }
  }, [user?.id]);
  
  // Delete goal from cloud
  const deleteGoal = useCallback(async (goalId: string) => {
    const userId = userIdRef.current || user?.id;
    if (!userId) {
      console.warn('deleteGoal: No user ID available');
      return;
    }
    
    // Skip if ID is not a valid UUID
    if (!isValidUUID(goalId)) {
      return;
    }
    
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting goal:', error);
    }
  }, [user?.id]);
  
  // Save habit to cloud
  const saveHabit = useCallback(async (habit: Habit) => {
    const userId = userIdRef.current || user?.id;
    if (!userId) {
      console.warn('saveHabit: No user ID available');
      return;
    }
    
    // Skip if ID is not a valid UUID
    if (!isValidUUID(habit.id)) {
      console.warn('Skipping habit with invalid UUID:', habit.id);
      return;
    }
    
    const { error } = await supabase
      .from('habits')
      .upsert({
        id: habit.id,
        user_id: userId,
        name: habit.name,
        emoji: habit.emoji,
        goal_id: habit.goalId && isValidUUID(habit.goalId) ? habit.goalId : null,
        period_type: 'weekly',
        selected_days: habit.weekDays,
        repeat_weekly: !habit.isOneTime,
        frequency_weeks: habit.repeatFrequency || 1,
        specific_weeks_of_month: habit.monthWeeks,
        xp_reward: habit.xpReward,
        notification_enabled: habit.notificationEnabled || false,
        notification_time: habit.notificationTime,
        start_date: habit.startDate || null,
        end_date: habit.endDate || null,
        has_micro_goals: habit.hasMicroGoals || false,
        micro_goals_count: habit.microGoalsCount || 1,
        micro_goals_names: habit.microGoalsNames || [],
      });
    
    if (error) {
      console.error('Error saving habit:', error);
    }
  }, [user?.id]);
  
  // Delete habit from cloud
  const deleteHabit = useCallback(async (habitId: string) => {
    const userId = userIdRef.current || user?.id;
    if (!userId) {
      console.warn('deleteHabit: No user ID available');
      return;
    }
    
    // Skip if ID is not a valid UUID
    if (!isValidUUID(habitId)) {
      return;
    }
    
    // First delete habit checks for this habit
    await supabase
      .from('habit_checks')
      .delete()
      .eq('habit_id', habitId)
      .eq('user_id', userId);
    
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting habit:', error);
    }
  }, [user?.id]);
  
  // Save habit check to cloud
  const saveHabitCheck = useCallback(async (habitId: string, date: string, completed: boolean, microGoalsCompleted?: number) => {
    const userId = userIdRef.current || user?.id;
    if (!userId) {
      console.warn('saveHabitCheck: No user ID available');
      return;
    }
    
    // Skip if habit ID is not a valid UUID
    if (!isValidUUID(habitId)) {
      console.warn('Skipping habit check with invalid habit UUID:', habitId);
      return;
    }
    
    const { error } = await supabase
      .from('habit_checks')
      .upsert({
        user_id: userId,
        habit_id: habitId,
        date: date,
        completed: completed,
        micro_goals_completed: microGoalsCompleted || 0,
      }, {
        onConflict: 'habit_id,date',
      });
    
    if (error) {
      console.error('Error saving habit check:', error);
    }
  }, [user?.id]);
  
  // Save daily log to cloud
  const saveDailyLog = useCallback(async (log: DailyLog) => {
    const userId = userIdRef.current || user?.id;
    if (!userId) {
      console.warn('saveDailyLog: No user ID available');
      return;
    }
    
    const { error } = await supabase
      .from('daily_logs')
      .upsert({
        user_id: userId,
        date: log.date,
        sleep_hours: log.sleepHours,
        phone_usage_hours: log.phoneUsageHours,
      }, {
        onConflict: 'user_id,date',
      });
    
    if (error) {
      console.error('Error saving daily log:', error);
    }
  }, [user?.id]);
  
  // Save custom category to cloud
  const saveCustomCategory = useCallback(async (category: CustomCategory) => {
    const userId = userIdRef.current || user?.id;
    if (!userId) {
      console.warn('saveCustomCategory: No user ID available');
      return;
    }
    
    // For categories with non-UUID IDs (like default_* overrides), we need to generate a proper UUID
    // But keep the original ID in the store for local reference
    let categoryIdForDb = category.id;
    
    // Check if this is a default category override (starts with "default_")
    if (category.id.startsWith('default_')) {
      // For default overrides, we still need to save them
      // Generate a deterministic UUID-like ID from the override ID
      categoryIdForDb = category.id;
    }
    
    // Skip if ID is not a valid UUID and not a default override
    if (!isValidUUID(categoryIdForDb) && !category.id.startsWith('default_')) {
      console.warn('Skipping category with invalid UUID:', category.id);
      return;
    }
    
    // If it's a default override, we need to check if it exists first and use upsert differently
    if (category.id.startsWith('default_')) {
      // Check if record exists
      const { data: existing } = await supabase
        .from('custom_categories')
        .select('id')
        .eq('user_id', userId)
        .eq('name', category.name)
        .maybeSingle();
      
      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('custom_categories')
          .update({
            name: category.name,
            emoji: category.emoji,
            xp_reward: category.xpReward,
          })
          .eq('id', existing.id);
        
        if (error) {
          console.error('Error updating category:', error);
        }
      } else {
        // Insert new with a proper UUID
        const newId = crypto.randomUUID();
        const { error } = await supabase
          .from('custom_categories')
          .insert({
            id: newId,
            user_id: userId,
            name: category.name,
            emoji: category.emoji,
            xp_reward: category.xpReward,
          });
        
        if (error) {
          console.error('Error inserting category:', error);
        }
      }
      return;
    }
    
    const { error } = await supabase
      .from('custom_categories')
      .upsert({
        id: category.id,
        user_id: userId,
        name: category.name,
        emoji: category.emoji,
        xp_reward: category.xpReward,
      });
    
    if (error) {
      console.error('Error saving category:', error);
    }
  }, [user?.id]);
  
  // Delete custom category from cloud
  const deleteCustomCategory = useCallback(async (categoryId: string) => {
    const userId = userIdRef.current || user?.id;
    if (!userId) {
      console.warn('deleteCustomCategory: No user ID available');
      return;
    }
    
    // Skip if ID is not a valid UUID
    if (!isValidUUID(categoryId)) {
      return;
    }
    
    const { error } = await supabase
      .from('custom_categories')
      .delete()
      .eq('id', categoryId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting category:', error);
    }
  }, [user?.id]);
  
  // Initial load when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Only load if user changed
      if (globalState.lastLoadedUserId !== user.id) {
        globalState.lastLoadedUserId = user.id;
        globalState.syncInProgress = false;
        globalState.isInitialLoad = true;
        loadFromCloud(user.id);
      }
    } else if (!isAuthenticated) {
      globalState.lastLoadedUserId = null;
      globalState.isInitialLoad = true;
    }
  }, [isAuthenticated, user?.id, loadFromCloud]);
  
  // Subscribe to store changes and sync to cloud
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    
    const unsubscribe = useAppStore.subscribe((state, prevState) => {
      // Skip during initial load
      if (globalState.isInitialLoad) return;
      
      // Use the userId from closure, fallback to ref
      const currentUserId = userId || userIdRef.current;
      if (!currentUserId) return;
      
      // Sync habits
      if (state.habits !== prevState.habits) {
        const currentHabitsStr = JSON.stringify(state.habits);
        if (currentHabitsStr !== globalState.lastSyncedData.habits) {
          const previousHabits: Habit[] = globalState.lastSyncedData.habits ? JSON.parse(globalState.lastSyncedData.habits) : [];
          const currentIds = new Set(state.habits.map(h => h.id));
          
          // Save new and updated habits
          state.habits.forEach(habit => {
            if (!isValidUUID(habit.id)) return;
            const prev = previousHabits.find(h => h.id === habit.id);
            if (!prev || JSON.stringify(prev) !== JSON.stringify(habit)) {
              saveHabit(habit);
            }
          });
          
          // Delete removed habits
          previousHabits.forEach(habit => {
            if (!currentIds.has(habit.id) && isValidUUID(habit.id)) {
              deleteHabit(habit.id);
            }
          });
          
          globalState.lastSyncedData.habits = currentHabitsStr;
        }
      }
      
      // Sync goals
      if (state.goals !== prevState.goals) {
        const currentGoalsStr = JSON.stringify(state.goals);
        if (currentGoalsStr !== globalState.lastSyncedData.goals) {
          const previousGoals: Goal[] = globalState.lastSyncedData.goals ? JSON.parse(globalState.lastSyncedData.goals) : [];
          const currentIds = new Set(state.goals.map(g => g.id));
          
          // Save new and updated goals
          state.goals.forEach(goal => {
            if (!isValidUUID(goal.id)) return;
            const prev = previousGoals.find(g => g.id === goal.id);
            if (!prev || JSON.stringify(prev) !== JSON.stringify(goal)) {
              saveGoal(goal);
            }
          });
          
          // Delete removed goals
          previousGoals.forEach(goal => {
            if (!currentIds.has(goal.id) && isValidUUID(goal.id)) {
              deleteGoal(goal.id);
            }
          });
          
          globalState.lastSyncedData.goals = currentGoalsStr;
        }
      }
      
      // Sync habit checks
      if (state.habitChecks !== prevState.habitChecks) {
        const currentChecksStr = JSON.stringify(state.habitChecks);
        if (currentChecksStr !== globalState.lastSyncedData.habitChecks) {
          const previousChecks: HabitCheck[] = globalState.lastSyncedData.habitChecks ? JSON.parse(globalState.lastSyncedData.habitChecks) : [];
          
          // Save new and updated checks
          state.habitChecks.forEach(check => {
            if (!isValidUUID(check.habitId)) return;
            const prev = previousChecks.find(c => c.habitId === check.habitId && c.date === check.date);
            if (!prev || prev.completed !== check.completed || prev.microGoalsCompleted !== check.microGoalsCompleted) {
              saveHabitCheck(check.habitId, check.date, check.completed, check.microGoalsCompleted);
            }
          });
          
          globalState.lastSyncedData.habitChecks = currentChecksStr;
        }
      }
      
      // Sync custom categories
      if (state.customCategories !== prevState.customCategories) {
        const currentCategoriesStr = JSON.stringify(state.customCategories);
        if (currentCategoriesStr !== globalState.lastSyncedData.customCategories) {
          const previousCategories: CustomCategory[] = globalState.lastSyncedData.customCategories ? JSON.parse(globalState.lastSyncedData.customCategories) : [];
          const currentIds = new Set(state.customCategories.map(c => c.id));
          
          // Save new and updated categories (including default overrides with non-UUID IDs)
          state.customCategories.forEach(category => {
            const prev = previousCategories.find(c => c.id === category.id);
            if (!prev || JSON.stringify(prev) !== JSON.stringify(category)) {
              saveCustomCategory(category);
            }
          });
          
          // Delete removed categories (only those with valid UUIDs can be deleted from DB)
          previousCategories.forEach(category => {
            if (!currentIds.has(category.id) && isValidUUID(category.id)) {
              deleteCustomCategory(category.id);
            }
          });
          
          globalState.lastSyncedData.customCategories = currentCategoriesStr;
        }
      }
      
      // Sync draco
      if (state.draco !== prevState.draco) {
        const currentDracoStr = JSON.stringify(state.draco);
        if (currentDracoStr !== globalState.lastSyncedData.draco) {
          saveDraco(state.draco);
          globalState.lastSyncedData.draco = currentDracoStr;
        }
      }
      
      // Sync user profile
      if (state.user !== prevState.user && state.user) {
        const currentUserStr = JSON.stringify(state.user);
        if (currentUserStr !== globalState.lastSyncedData.user) {
          saveProfile(state.user);
          globalState.lastSyncedData.user = currentUserStr;
        }
      }
      
      // Sync settings
      if (state.settings !== prevState.settings) {
        const currentSettingsStr = JSON.stringify(state.settings);
        if (currentSettingsStr !== globalState.lastSyncedData.settings) {
          saveSettings(state.settings);
          globalState.lastSyncedData.settings = currentSettingsStr;
        }
      }
    });
    
    return () => unsubscribe();
  }, [user?.id, saveHabit, deleteHabit, saveGoal, deleteGoal, saveHabitCheck, saveCustomCategory, deleteCustomCategory, saveDraco, saveProfile, saveSettings]);
  
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
