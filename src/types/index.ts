export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  photo: string;
}

export interface Habit {
  id: string;
  name: string;
  emoji?: string;
  xpReward: number;
  createdAt: string;
}

export interface HabitCheck {
  habitId: string;
  date: string;
  completed: boolean;
}

export type GoalType = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

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
  createdAt: string;
}

export interface DracoState {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
}

export type ThemeColor = 'blue' | 'green' | 'yellow' | 'neutral' | 'red' | 'purple' | 'pink' | 'orange' | 'lilac' | 'gray';
export type ProgressDisplayMode = 'linear' | 'circular';

export interface NotificationReminder {
  id: string;
  time: string;
  message: string;
  enabled: boolean;
}

export interface AppSettings {
  themeColor: ThemeColor;
  progressDisplayMode: ProgressDisplayMode;
  showEmojis: boolean;
  notificationsEnabled: boolean;
  notificationReminders: NotificationReminder[];
}

export type TabType = 'daily' | 'year' | 'goals' | 'profile' | 'settings';
