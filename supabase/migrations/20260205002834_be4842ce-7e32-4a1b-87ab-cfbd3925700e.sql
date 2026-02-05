-- Add is_bad_habit column to habits table
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS is_bad_habit BOOLEAN NOT NULL DEFAULT false;