-- Micro-objetivos: persistir configuração no hábito e progresso por dia

ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS has_micro_goals boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS micro_goals_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS micro_goals_names text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.habit_checks
  ADD COLUMN IF NOT EXISTS micro_goals_completed integer NOT NULL DEFAULT 0;