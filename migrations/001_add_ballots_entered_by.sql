-- Migration: add entered_by column to ballots
-- Run this on your Postgres / Supabase DB to add the missing column

ALTER TABLE public.ballots
ADD COLUMN IF NOT EXISTS entered_by VARCHAR(255);

-- Optional: set a default or backfill recently used logs if needed
-- UPDATE public.ballots SET entered_by = 'SYSTEM' WHERE entered_by IS NULL;
