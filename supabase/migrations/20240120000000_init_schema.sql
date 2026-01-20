-- Create App Users Table
create table app_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed Users
insert into app_users (username) values
('Bobo'),
('helo let'),
('helo court'),
('palou'),
('toutoune'),
('Axelle'),
('Gauthier'),
('jojo'),
('Armance'),
('quintin'),
('Quitterie');

-- Create Houses Table
create table houses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references app_users(id) not null,
  title text not null,
  address text not null,
  lat float8,
  lng float8,
  image_url text,
  link text,
  price numeric,
  bedrooms int,
  beds int,
  distance_sea_min int,
  has_pool boolean default false,
  has_jacuzzi boolean default false,
  has_bbq boolean default false,
  has_big_kitchen boolean default false,
  pros text,
  cons text,
  other_equip text,
  details text
);

-- Create Votes Table
create table votes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  house_id uuid references houses(id) on delete cascade not null,
  user_id uuid references app_users(id) not null,
  rating int check (rating >= 1 and rating <= 4),
  comment text,
  unique(house_id, user_id)
);

-- Enable Row Level Security (RLS) - Optional for this private group app but good practice.
-- Since there is no "Auth" (JWT), we might skip complex RLS or just enable public access for simplicity given the requirements.
-- For this prototype/MVP, we will rely on the app logic, but enabling RLS with public access for now ensures we can lock it down later.
alter table app_users enable row level security;
alter table houses enable row level security;
alter table votes enable row level security;

create policy "Enable all access for now" on app_users for all using (true);
create policy "Enable all access for now" on houses for all using (true);
create policy "Enable all access for now" on votes for all using (true);
