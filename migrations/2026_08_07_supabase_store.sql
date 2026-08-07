-- Migration: add Supabase-backed storage tables used by the Vercel deployment.
-- Run this in the Supabase SQL editor (or `supabase db push`) BEFORE redeploying.

-- Per-user roles (replaces user_roles.json)
CREATE TABLE IF NOT EXISTS public.user_roles (
  username text PRIMARY KEY,
  role text NOT NULL DEFAULT 'dashboard',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Per-user page access (replaces user_pages.json)
CREATE TABLE IF NOT EXISTS public.user_pages (
  username text PRIMARY KEY,
  pages jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Candidate list (replaces candidate_list.json)
CREATE TABLE IF NOT EXISTS public.candidates (
  id bigint PRIMARY KEY,
  candidate_name text NOT NULL DEFAULT '',
  sr_number text NOT NULL DEFAULT '',
  gujarati_name text NOT NULL DEFAULT '',
  member_id text NOT NULL DEFAULT '',
  candidate_number text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  mobile text NOT NULL DEFAULT '',
  photo text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Candidate party logos keyed by candidate sr_number (replaces candidate_logos.json)
CREATE TABLE IF NOT EXISTS public.candidate_logos (
  sr_number text PRIMARY KEY,
  logo_url text NOT NULL DEFAULT ''
);

-- Ballot entry log (replaces ballot_entry_log.json)
CREATE TABLE IF NOT EXISTS public.ballot_entry_log (
  ballot_id text PRIMARY KEY,
  entered_by text NOT NULL DEFAULT '',
  cast_type text NOT NULL DEFAULT 'online',
  timestamp timestamptz DEFAULT now()
);

-- Voters list (replaces voters.json)
CREATE TABLE IF NOT EXISTS public.voters (
  id bigint PRIMARY KEY,
  sr_number text NOT NULL DEFAULT '',
  member_id text NOT NULL DEFAULT '',
  voter_name text NOT NULL DEFAULT '',
  gujarati_name text NOT NULL DEFAULT '',
  gender text NOT NULL DEFAULT '',
  birthdate text NOT NULL DEFAULT '',
  age text NOT NULL DEFAULT '',
  mobile text NOT NULL DEFAULT '',
  mobile2 text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  village text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address_guj text NOT NULL DEFAULT '',
  city_guj text NOT NULL DEFAULT '',
  fee_payment text NOT NULL DEFAULT '',
  photo text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  cancel_remarks text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voters_sr_number ON public.voters (sr_number);
CREATE INDEX IF NOT EXISTS idx_voters_member_id ON public.voters (member_id);

-- Storage bucket for uploaded images (photos + logos). Public read so the
-- returned public URLs work everywhere.
INSERT INTO storage.buckets (id, name, public)
VALUES ('election-assets', 'election-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;
