-- Run this in Supabase: Dashboard → SQL Editor → New query → paste and Run
-- Creates the table for the trivia question bank.
-- The server uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  q text not null,
  options jsonb not null check (jsonb_array_length(options) = 4),
  answer smallint not null check (answer >= 0 and answer <= 3)
);
