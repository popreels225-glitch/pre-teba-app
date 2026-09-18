-- Spusti v Supabase Dashboard → SQL Editor.
-- Pred spustením zmeň admin@example.com na e-mail správcu.

create table if not exists public.game_submissions (
  id uuid primary key default gen_random_uuid(),
  player_name text not null check (char_length(player_name) between 1 and 24),
  activity text not null,
  payload jsonb not null,
  submitted_at timestamptz not null default now()
);

alter table public.game_submissions enable row level security;

create policy "Anyone may submit a completed game"
on public.game_submissions for insert
to anon, authenticated
with check (true);

create policy "Only the administrator may read submissions"
on public.game_submissions for select
to authenticated
using ((auth.jwt() ->> 'email') = 'admin@example.com');
