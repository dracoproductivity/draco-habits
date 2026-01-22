-- Add custom_category_id column to goals table
ALTER TABLE public.goals ADD COLUMN custom_category_id UUID REFERENCES public.custom_categories(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_goals_custom_category_id ON public.goals(custom_category_id);