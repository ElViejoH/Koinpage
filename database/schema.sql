create table if not exists users (
  id text primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists members (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  name text not null,
  role text not null,
  emoji text not null default '🧑',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists transactions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  member_id text not null references members(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  date date not null,
  description text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists budgets (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  category text not null,
  month text not null,
  limit_amount numeric(12,2) not null check (limit_amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create unique index if not exists budgets_user_month_category_idx
  on budgets (user_id, month, lower(category));

create index if not exists members_user_id_idx on members (user_id);
create index if not exists transactions_user_id_idx on transactions (user_id);
create index if not exists transactions_member_id_idx on transactions (member_id);
create index if not exists budgets_user_id_idx on budgets (user_id);
