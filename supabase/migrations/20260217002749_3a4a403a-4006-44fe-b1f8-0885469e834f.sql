
-- Add archived column to habits
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Add archived column to goals
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
