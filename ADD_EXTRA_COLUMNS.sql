-- Add extra columns to votes table
-- Run this in Supabase SQL Editor: https://app.supabase.com → SQL Editor → New Query

ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS form_no VARCHAR(50);
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS application_date VARCHAR(50);
