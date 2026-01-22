export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate?: string; // ISO date string
  photo: string;
}

export interface Habit {
  id: string;
  name: string;
  emoji?: string;
  xpReward: number;
  goalId?: string; // Linked goal
  notificationEnabled?: boolean;
  notificationTime?: string;
  weekDays?: number[]; // 0=Sunday, 1=Monday, etc. Days the habit repeats
  isOneTime?: boolean; // If true, it's a single event without repetition
  repeatFrequency?: 1 | 2 | 3 | 4; // Repeats every X weeks (1=every week, 2=every 2 weeks, etc.)
  monthWeeks?: number[]; // 1-5, specific weeks of month (1=first week, 2=second week, etc.)
  createdAt: string;
}

export interface HabitCheck {
  habitId: string;
  date: string;
  completed: boolean;
}

export type GoalType = 'weekly' | 'monthly' | 'quarterly' | 'semestral' | 'yearly';

export type GoalCategory = 
  | 'physical_health' 
  | 'study' 
  | 'mental_health' 
  | 'work' 
  | 'custom';

export interface CustomCategory {
  id: string;
  name: string;
  emoji?: string;
  xpReward: number; // 0, 10, 20, 30, 40, 50
}

export interface Goal {
  id: string;
  name: string;
  emoji?: string;
  type: GoalType;
  period: string; // e.g., "2025", "Q1-2025", "March-2025", "Week-13-2025"
  progress: number; // 0-100
  wallpaper?: string;
  parentGoalId?: string; // Reference to parent goal (weekly→monthly→quarterly→yearly)
  weekDays?: number[]; // 0=Sunday, 1=Monday, etc. (for weekly goals)
  repeatWeekly?: boolean; // If true, repeats every week; if false, only for selected period
  category?: GoalCategory;
  customCategoryId?: string;
  categoryXP?: number; // XP reward for habits linked to this goal (0, 10, 20, 30, 40, 50)
  createdAt: string;
}

export interface DracoState {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  name: string;
  color: 'white' | 'gray' | 'lavender' | 'orange' | 'pink' | 'purple' | 'red' | 'black' | 'silver' | 'gold' | 'rainbow' | 'green' | 'blue' | 
         // Legacy colors - keep for backwards compatibility
         'yellow' | 'neutral' | 'lilac' | 'mint';
}

export type ThemeColor = 'blue' | 'green' | 'yellow' | 'neutral' | 'red' | 'purple' | 'pink' | 'orange' | 'lilac' | 'gray' | 'mint';
export type ProgressDisplayMode = 'linear' | 'circular';

export interface NotificationReminder {
  id: string;
  time: string;
  message: string;
  enabled: boolean;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  sleepHours: number;
  phoneUsageHours: number;
}

export interface AppSettings {
  themeColor: ThemeColor;
  progressDisplayMode: ProgressDisplayMode;
  showEmojis: boolean;
  notificationsEnabled: boolean;
  notificationReminders: NotificationReminder[];
  darkMode: boolean;
  minSleepHours: number; // minimum recommended sleep hours
  maxPhoneHours: number; // maximum recommended phone usage hours
  lastDailyLogDate?: string; // last date user filled the morning check-in
  accountCreatedAt?: string; // ISO date string of when the account was created
}

export type TabType = 'daily' | 'goals' | 'analytics' | 'settings';

export const DEFAULT_CATEGORIES: { id: GoalCategory; name: string; emoji: string }[] = [
  { id: 'physical_health', name: 'Saúde Física', emoji: '💪' },
  { id: 'study', name: 'Estudo', emoji: '📚' },
  { id: 'mental_health', name: 'Saúde Mental', emoji: '🧠' },
  { id: 'work', name: 'Trabalho', emoji: '💼' },
];

export const XP_OPTIONS = [0, 10, 20, 30, 40, 50];
