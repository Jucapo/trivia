-- Run this in Supabase: Dashboard → SQL Editor → New query → paste and Run
-- Creates categories + questions model for trivia question banks.
-- The server uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.

create table if not exists public.categories (
  name text primary key
);

insert into public.categories(name)
values
  ('cultura'),
  ('historia'),
  ('geografia'),
  ('entretenimiento'),
  ('videojuegos'),
  ('musica')
on conflict (name) do nothing;

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  q text not null,
  options jsonb not null check (jsonb_array_length(options) = 4),
  answer smallint not null check (answer >= 0 and answer <= 3),
  category text not null default 'cultura',
  difficulty text not null default 'media' check (difficulty in ('baja', 'media', 'alta')),
  source text not null default 'user' check (source in ('static', 'user'))
);

alter table public.questions
  add column if not exists category text not null default 'cultura';

alter table public.questions
  add column if not exists difficulty text not null default 'media';

alter table public.questions
  add column if not exists source text not null default 'user';
