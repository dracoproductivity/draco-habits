-- Add wallpaper and glass effect columns to user_settings
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS wallpaper_light text,
ADD COLUMN IF NOT EXISTS wallpaper_dark text,
ADD COLUMN IF NOT EXISTS wallpaper_mobile_light text,
ADD COLUMN IF NOT EXISTS wallpaper_mobile_dark text,
ADD COLUMN IF NOT EXISTS glass_blur integer NOT NULL DEFAULT 20,
ADD COLUMN IF NOT EXISTS glass_opacity integer NOT NULL DEFAULT 65;