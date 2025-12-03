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
  createdAt: string;
}

export interface DracoState {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
}

export interface AppSettings {
  backgroundColor: string;
  fontColor: string;
  showEmojis: boolean;
  notificationsEnabled: boolean;
  notificationTime: string;
}

export type TabType = 'daily' | 'year' | 'goals' | 'profile' | 'settings';
