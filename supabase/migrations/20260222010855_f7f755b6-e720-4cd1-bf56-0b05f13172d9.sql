-- Add vacation_mode column to habits table
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS vacation_mode boolean NOT NULL DEFAULT false;