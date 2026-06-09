export const supabase_schema = `-- Run this SQL in your Supabase SQL Editor to create the tables, relationships, and RLS policies

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: users
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  unique_id text unique not null,
  username text not null,
  email text unique not null,
  password text not null,
  balance numeric default 0,
  is_admin boolean default false,
  is_bot boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: notifications
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id),
  message text not null,
  type text not null,
  read boolean default false,
  created_at bigint not null
);

-- Table: battles
create table public.battles (
  id uuid primary key default uuid_generate_v4(),
  player1_id uuid references public.users(id),
  player2_id uuid references public.users(id),
  stake numeric default 0,
  pot numeric default 0,
  status text default 'LIVE',
  player1_votes integer default 0,
  player2_votes integer default 0,
  type text not null,
  duration_ms bigint not null,
  winner_id text,
  notified boolean default false,
  created_at bigint not null
);

-- Table: transactions
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id),
  type text not null,
  amount numeric not null,
  date bigint not null
);

-- Table: challenges
create table public.challenges (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references public.users(id),
  receiver_id uuid references public.users(id),
  stake numeric default 0,
  type text not null,
  duration_ms bigint not null,
  status text default 'PENDING',
  created_at bigint not null
);

-- Table: deposits
create table public.deposits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id),
  amount numeric not null,
  receipt_url text,
  transaction_id text,
  status text default 'PENDING',
  timestamp bigint not null
);

-- Table: pending_requests (Withdrawals and Deposits)
create table public.pending_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id),
  type text not null,
  amount numeric not null,
  easypaisa_number text,
  status text default 'PENDING',
  date bigint not null
);

-- Table: stats
create table public.stats (
  id text primary key default 'global',
  total_commission numeric default 0,
  active_battles integer default 0,
  pending_deposits integer default 0,
  pending_withdrawals integer default 0,
  deposit_account_number text,
  deposit_link text,
  deposit_iban text,
  platform_fee_percent numeric default 20,
  min_withdrawal numeric default 500,
  max_withdrawal numeric default 50000,
  quick_stakes text default '500,1000,2000,5000',
  grand_stakes text default '10000,25000,50000,100000',
  enable_quick_battles boolean default true,
  enable_grand_battles boolean default true,
  signup_bonus numeric default 1000
);
insert into public.stats (id, deposit_account_number) values ('global', '03001234567') on conflict do nothing;

-- Enable Realtime for all operational tables
alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.battles;
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.challenges;
alter publication supabase_realtime add table public.deposits;
alter publication supabase_realtime add table public.pending_requests;
alter publication supabase_realtime add table public.stats;
alter publication supabase_realtime add table public.notifications;


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
alter table public.users enable row level security;
alter table public.battles enable row level security;
alter table public.transactions enable row level security;
alter table public.challenges enable row level security;
alter table public.deposits enable row level security;
alter table public.pending_requests enable row level security;
alter table public.stats enable row level security;

-- Users can read all users (needed to find players)
create policy "Anyone can read users" on public.users for select using (true);
-- Users can only insert/update their own rows, EXCEPT admin who can update any
create policy "Users can modify themselves" on public.users for update using (true);
create policy "Anyone can create users" on public.users for insert with check (true);

-- Battles are public to read
create policy "Anyone can read battles" on public.battles for select using (true);
create policy "Anyone can create battles" on public.battles for insert with check (true);
create policy "Anyone can update battles" on public.battles for update using (true);

-- Transactions: read public, create public
create policy "Anyone can read transactions" on public.transactions for select using (true);
create policy "Anyone can insert transactions" on public.transactions for insert with check (true);

-- Challenges
create policy "Anyone can read challenges" on public.challenges for select using (true);
create policy "Anyone can insert challenges" on public.challenges for insert with check (true);
create policy "Anyone can update challenges" on public.challenges for update using (true);

-- Deposits (Users can read their own or admins can read all)
create policy "Anyone can read deposits" on public.deposits for select using (true);
create policy "Anyone can insert deposits" on public.deposits for insert with check (true);
create policy "Anyone can update deposits" on public.deposits for update using (true);

-- Pending requests
create policy "Anyone can read pending requests" on public.pending_requests for select using (true);
create policy "Anyone can insert pending requests" on public.pending_requests for insert with check (true);
create policy "Anyone can update pending requests" on public.pending_requests for update using (true);

-- Stats
create policy "Anyone can read stats" on public.stats for select using (true);
create policy "Anyone can modify stats" on public.stats for update using (true);

-- Notifications
alter table public.notifications enable row level security;
create policy "Anyone can read notifications" on public.notifications for select using (true);
create policy "Anyone can insert notifications" on public.notifications for insert with check (true);
create policy "Anyone can update notifications" on public.notifications for update using (true);

-- ==========================================
-- RPCs FOR ATOMIC OPERATIONS
-- ==========================================
create or replace function public.increment_player1_votes(row_id uuid)
returns void as $$
begin
  update public.battles
  set player1_votes = player1_votes + 1
  where id = row_id;
end;
$$ language plpgsql security definer;

create or replace function public.increment_player2_votes(row_id uuid)
returns void as $$
begin
  update public.battles
  set player2_votes = player2_votes + 1
  where id = row_id;
end;
$$ language plpgsql security definer;

create or replace function public.increment_balance(row_id uuid, amount numeric)
returns void as $$
begin
  update public.users
  set balance = balance + amount
  where id = row_id and (balance + amount) >= 0;
  
  if not found then
    raise exception 'Insufficient balance or user not found';
  end if;
end;
$$ language plpgsql security definer;`;
