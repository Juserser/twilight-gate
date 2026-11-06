-- 황혼의 문: 클라우드 저장 테이블
-- Supabase 대시보드 → SQL Editor → New query 에 붙여 넣고 Run

create table if not exists public.saves (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  slot int not null check (slot between 1 and 3),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, slot)
);

alter table public.saves enable row level security;

-- 자기 저장만 읽고 쓸 수 있다
create policy "saves: read own"   on public.saves for select using (auth.uid() = user_id);
create policy "saves: insert own" on public.saves for insert with check (auth.uid() = user_id);
create policy "saves: update own" on public.saves for update using (auth.uid() = user_id);
create policy "saves: delete own" on public.saves for delete using (auth.uid() = user_id);
