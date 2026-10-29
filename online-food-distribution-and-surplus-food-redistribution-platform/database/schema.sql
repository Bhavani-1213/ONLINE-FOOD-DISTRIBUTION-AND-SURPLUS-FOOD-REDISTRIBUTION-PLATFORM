-- FoodShare database schema for Supabase PostgreSQL
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  email varchar(255) not null unique,
  password_hash text not null,
  role varchar(20) not null check (role in ('donor','recipient','volunteer','admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists food_listings (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references profiles(id) on delete cascade,
  title varchar(120) not null,
  category varchar(60) not null,
  quantity integer not null check (quantity > 0),
  expiry_at timestamptz not null,
  pickup_location varchar(200) not null,
  description varchar(1000) not null default '',
  status varchar(20) not null default 'available' check (status in ('available','reserved','collected','expired','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references food_listings(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  status varchar(20) not null default 'requested' check (status in ('requested','approved','fulfilled','cancelled','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_food_status on food_listings(status);
create index if not exists idx_food_donor on food_listings(donor_id);
create index if not exists idx_food_expiry on food_listings(expiry_at);
create index if not exists idx_claim_recipient on claims(recipient_id);
create index if not exists idx_claim_food on claims(food_id);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists food_listings_updated_at on food_listings;
create trigger food_listings_updated_at before update on food_listings
for each row execute function set_updated_at();

drop trigger if exists claims_updated_at on claims;
create trigger claims_updated_at before update on claims
for each row execute function set_updated_at();

-- The backend uses a server-only Supabase service-role key and performs
-- authorization checks before database writes. RLS can be enabled later
-- if the application is migrated to Supabase Auth.
