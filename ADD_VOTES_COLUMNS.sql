-- Add missing columns to votes table
-- Run this in Supabase SQL Editor: https://app.supabase.com → SQL Editor → New Query

ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS member_id VARCHAR(50);
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS gujarati_name TEXT;
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS birthdate VARCHAR(50);
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS age VARCHAR(10);
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS mobile2 VARCHAR(20);
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS address_guj TEXT;
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS city_guj VARCHAR(255);
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS fee_payment VARCHAR(50);
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS photo TEXT;
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS cancel_remarks TEXT;
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS form_no VARCHAR(50);
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS application_date VARCHAR(50);
