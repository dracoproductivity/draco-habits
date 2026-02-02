-- Add columns to track schedule history
-- When the schedule (weekDays, repeatFrequency, monthWeeks) changes,
-- the previous values are stored so old dates use the old schedule

ALTER TABLE public.habits 
ADD COLUMN IF NOT EXISTS schedule_updated_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS previous_selected_days integer[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS previous_frequency_weeks integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS previous_specific_weeks_of_month integer[] DEFAULT NULL;